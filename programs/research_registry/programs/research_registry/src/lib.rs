use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Dcsc3iM5Q9hGPgQtaHHP7mBA3azaiW9rgcmguPuZhRzD");

pub const MAX_SLUG_LEN: usize = 32;
pub const MAX_URI_LEN: usize = 200;

// MVP Config
// Hardcoded Treasury (matches SDK constant)
pub const TREASURY_PUBKEY: Pubkey = pubkey!("9G8DEvKZmc1ssMyMmxd969GhCMaVT2eYtjGTzwDBshKt");

// Fees (in lamports)
pub const PROJECT_FEE_LAMPORTS: u64 = 5_000_000;   // 0.005 SOL
pub const DATASET_FEE_LAMPORTS: u64 = 1_000_000;   // 0.001 SOL
pub const POLL_FEE_LAMPORTS: u64 = 1_000_000;      // 0.001 SOL
pub const PRO_SUB_LAMPORTS: u64 = 100_000_000;     // 0.1 SOL
pub const PRO_DURATION_SECONDS: i64 = 30 * 24 * 60 * 60; // 30 days

#[program]
pub mod research_registry {
    use super::*;

    pub fn subscribe_pro(ctx: Context<SubscribePro>) -> Result<()> {
        // Rebuild trigger
        let authority = &ctx.accounts.authority;
        let treasury = &ctx.accounts.treasury;
        let subscription = &mut ctx.accounts.subscription;
        let system_program = &ctx.accounts.system_program;

        // Verify treasury
        require_keys_eq!(treasury.key(), TREASURY_PUBKEY, ErrorCode::InvalidTreasury);

        // Charge fee
        let cpi_context = CpiContext::new(
            system_program.to_account_info(),
            system_program::Transfer {
                from: authority.to_account_info(),
                to: treasury.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, PRO_SUB_LAMPORTS)?;

        // Update subscription
        let now = Clock::get()?.unix_timestamp;
        
        // If already active, extend. Else start from now.
        if subscription.expires_at > now {
            subscription.expires_at = subscription.expires_at.checked_add(PRO_DURATION_SECONDS).ok_or(ErrorCode::MathOverflow)?;
        } else {
            subscription.expires_at = now.checked_add(PRO_DURATION_SECONDS).ok_or(ErrorCode::MathOverflow)?;
        }
        
        subscription.authority = authority.key();

        emit!(SubscriptionUpdated {
            authority: authority.key(),
            expires_at: subscription.expires_at,
        });

        Ok(())
    }

    pub fn create_project(
        ctx: Context<CreateProject>,
        slug: String,
        metadata_uri: String,
    ) -> Result<()> {
        require!(slug.len() <= MAX_SLUG_LEN, ErrorCode::SlugTooLong);
        require!(
            metadata_uri.len() <= MAX_URI_LEN,
            ErrorCode::MetadataUriTooLong
        );

        // Check subscription or charge fee
        let is_subscribed = if let Some(sub) = &ctx.accounts.subscription {
            let now = Clock::get()?.unix_timestamp;
            sub.expires_at > now && sub.authority == ctx.accounts.authority.key()
        } else {
            false
        };

        if !is_subscribed {
            let treasury = &ctx.accounts.treasury;
            require_keys_eq!(treasury.key(), TREASURY_PUBKEY, ErrorCode::InvalidTreasury);

            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: treasury.to_account_info(),
                },
            );
            system_program::transfer(cpi_context, PROJECT_FEE_LAMPORTS)?;
        }

        let project = &mut ctx.accounts.project;
        project.authority = ctx.accounts.authority.key();
        project.slug = slug;
        project.metadata_uri = metadata_uri;
        project.created_at = Clock::get()?.unix_timestamp;
        project.dataset_count = 0;

        emit!(ProjectCreated {
            project: project.key(),
            authority: project.authority,
            slug: project.slug.clone(),
            created_at: project.created_at,
        });

        Ok(())
    }

    pub fn add_dataset(
        ctx: Context<AddDataset>,
        version: u32,
        content_hash: [u8; 32],
        data_uri: String,
    ) -> Result<()> {
        require!(data_uri.len() <= MAX_URI_LEN, ErrorCode::DataUriTooLong);

        // Check subscription or charge fee
        let is_subscribed = if let Some(sub) = &ctx.accounts.subscription {
            let now = Clock::get()?.unix_timestamp;
            sub.expires_at > now && sub.authority == ctx.accounts.authority.key()
        } else {
            false
        };

        if !is_subscribed {
            let treasury = &ctx.accounts.treasury;
            require_keys_eq!(treasury.key(), TREASURY_PUBKEY, ErrorCode::InvalidTreasury);

            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: treasury.to_account_info(),
                },
            );
            system_program::transfer(cpi_context, DATASET_FEE_LAMPORTS)?;
        }

        let project = &mut ctx.accounts.project;
        let dataset = &mut ctx.accounts.dataset;
        dataset.project = project.key();
        dataset.version = version;
        dataset.content_hash = content_hash;
        dataset.data_uri = data_uri;
        dataset.created_at = Clock::get()?.unix_timestamp;

        project.dataset_count = project
            .dataset_count
            .checked_add(1)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(DatasetAdded {
            project: project.key(),
            dataset: dataset.key(),
            version,
            created_at: dataset.created_at,
        });

        Ok(())
    }

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        question_uri: String,
        options_hash: [u8; 32],
        end_ts: i64,
        mode: u8,
    ) -> Result<()> {
        require!(
            question_uri.len() <= MAX_URI_LEN,
            ErrorCode::QuestionUriTooLong
        );
        require!(mode == 0, ErrorCode::InvalidPollMode);
        
        let now = Clock::get()?.unix_timestamp;
        require!(end_ts > now, ErrorCode::PollEndInPast);

        // Check subscription or charge fee
        let is_subscribed = if let Some(sub) = &ctx.accounts.subscription {
            sub.expires_at > now && sub.authority == ctx.accounts.authority.key()
        } else {
            false
        };

        if !is_subscribed {
            let treasury = &ctx.accounts.treasury;
            require_keys_eq!(treasury.key(), TREASURY_PUBKEY, ErrorCode::InvalidTreasury);

            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: treasury.to_account_info(),
                },
            );
            system_program::transfer(cpi_context, POLL_FEE_LAMPORTS)?;
        }

        let project = &ctx.accounts.project;
        let poll = &mut ctx.accounts.poll;
        poll.project = project.key();
        poll.question_uri = question_uri;
        poll.options_hash = options_hash;
        poll.end_ts = end_ts;
        poll.mode = mode;
        poll.yes_votes = 0;
        poll.no_votes = 0;

        emit!(PollCreated {
            poll: poll.key(),
            project: poll.project,
            end_ts: poll.end_ts,
            mode: poll.mode,
        });

        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>, choice: u8) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let now = Clock::get()?.unix_timestamp;
        require!(now <= poll.end_ts, ErrorCode::PollAlreadyEnded);
        require!(poll.mode == 0, ErrorCode::InvalidPollMode);
        require!(choice == 0 || choice == 1, ErrorCode::InvalidChoice);

        let vote_receipt = &mut ctx.accounts.vote_receipt;
        vote_receipt.poll = poll.key();
        vote_receipt.voter = ctx.accounts.voter.key();
        vote_receipt.choice = choice;
        vote_receipt.voted_at = now;

        if choice == 1 {
            poll.yes_votes = poll
                .yes_votes
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
        } else {
            poll.no_votes = poll
                .no_votes
                .checked_add(1)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        emit!(VoteCast {
            poll: poll.key(),
            voter: vote_receipt.voter,
            choice,
            voted_at: vote_receipt.voted_at,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SubscribePro<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        space = Subscription::SPACE,
        seeds = [b"sub", authority.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    /// CHECK: Verified in handler against constant
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(slug: String)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Project::SPACE,
        seeds = [b"project", authority.key().as_ref(), slug.as_bytes()],
        bump
    )]
    pub project: Account<'info, Project>,
    
    // Optional Subscription
    #[account(
        seeds = [b"sub", authority.key().as_ref()],
        bump
    )]
    pub subscription: Option<Account<'info, Subscription>>,

    /// CHECK: Verified in handler if fee charged
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(version: u32)]
pub struct AddDataset<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        has_one = authority
    )]
    pub project: Account<'info, Project>,
    #[account(
        init,
        payer = authority,
        space = Dataset::SPACE,
        seeds = [b"dataset", project.key().as_ref(), &version.to_le_bytes()],
        bump
    )]
    pub dataset: Account<'info, Dataset>,
    
    #[account(
        seeds = [b"sub", authority.key().as_ref()],
        bump
    )]
    pub subscription: Option<Account<'info, Subscription>>,

    /// CHECK: Verified in handler if fee charged
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(question_uri: String, options_hash: [u8; 32])]
pub struct CreatePoll<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        has_one = authority
    )]
    pub project: Account<'info, Project>,
    #[account(
        init,
        payer = authority,
        space = Poll::SPACE,
        seeds = [b"poll", project.key().as_ref(), options_hash.as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        seeds = [b"sub", authority.key().as_ref()],
        bump
    )]
    pub subscription: Option<Account<'info, Subscription>>,

    /// CHECK: Verified in handler if fee charged
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(
        mut,
        seeds = [b"poll", poll.project.as_ref(), poll.options_hash.as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
        init,
        payer = voter,
        space = VoteReceipt::SPACE,
        seeds = [b"vote", poll.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Subscription {
    pub authority: Pubkey,
    pub expires_at: i64,
}

impl Subscription {
    pub const SPACE: usize = 8 + 32 + 8;
}

#[account]
pub struct Project {
    pub authority: Pubkey,
    pub slug: String,
    pub metadata_uri: String,
    pub created_at: i64,
    pub dataset_count: u32,
}

impl Project {
    pub const SPACE: usize =
        8 + 32 + 4 + MAX_SLUG_LEN + 4 + MAX_URI_LEN + 8 + 4;
}

#[account]
pub struct Dataset {
    pub project: Pubkey,
    pub version: u32,
    pub content_hash: [u8; 32],
    pub data_uri: String,
    pub created_at: i64,
}

impl Dataset {
    pub const SPACE: usize = 8 + 32 + 4 + 32 + 4 + MAX_URI_LEN + 8;
}

#[account]
pub struct Poll {
    pub project: Pubkey,
    pub question_uri: String,
    pub options_hash: [u8; 32],
    pub end_ts: i64,
    pub mode: u8,
    pub yes_votes: u64,
    pub no_votes: u64,
}

impl Poll {
    pub const SPACE: usize = 8 + 32 + 4 + MAX_URI_LEN + 32 + 8 + 1 + 8 + 8;
}

#[account]
pub struct VoteReceipt {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub choice: u8,
    pub voted_at: i64,
}

impl VoteReceipt {
    pub const SPACE: usize = 8 + 32 + 32 + 1 + 8;
}

#[event]
pub struct SubscriptionUpdated {
    pub authority: Pubkey,
    pub expires_at: i64,
}

#[event]
pub struct ProjectCreated {
    pub project: Pubkey,
    pub authority: Pubkey,
    pub slug: String,
    pub created_at: i64,
}

#[event]
pub struct DatasetAdded {
    pub project: Pubkey,
    pub dataset: Pubkey,
    pub version: u32,
    pub created_at: i64,
}

#[event]
pub struct PollCreated {
    pub poll: Pubkey,
    pub project: Pubkey,
    pub end_ts: i64,
    pub mode: u8,
}

#[event]
pub struct VoteCast {
    pub poll: Pubkey,
    pub voter: Pubkey,
    pub choice: u8,
    pub voted_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Slug too long")]
    SlugTooLong,
    #[msg("Metadata URI too long")]
    MetadataUriTooLong,
    #[msg("Data URI too long")]
    DataUriTooLong,
    #[msg("Question URI too long")]
    QuestionUriTooLong,
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid poll mode")]
    InvalidPollMode,
    #[msg("Invalid vote choice")]
    InvalidChoice,
    #[msg("Poll already ended")]
    PollAlreadyEnded,
    #[msg("Poll end time must be in the future")]
    PollEndInPast,
    #[msg("Invalid treasury address")]
    InvalidTreasury,
}
