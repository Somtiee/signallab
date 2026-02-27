import { Idl } from "@coral-xyz/anchor";

export type ResearchRegistry = {
  "address": "Dcsc3iM5Q9hGPgQtaHHP7mBA3azaiW9rgcmguPuZhRzD",
  "metadata": {
    "name": "research_registry",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "subscribe_pro",
      "discriminator": [
        58,
        68,
        40,
        33,
        109,
        24,
        133,
        21
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "subscription",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "add_dataset",
      "discriminator": [
        217,
        45,
        77,
        241,
        13,
        37,
        74,
        189
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "writable": true
        },
        {
          "name": "dataset",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  97,
                  116,
                  97,
                  115,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project"
              },
              {
                "kind": "arg",
                "path": "version"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "version",
          "type": "u32"
        },
        {
          "name": "content_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "data_uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "cast_vote",
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "poll",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "poll.project",
                "account": "Poll"
              },
              {
                "kind": "account",
                "path": "poll.options_hash",
                "account": "Poll"
              }
            ]
          }
        },
        {
          "name": "vote_receipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "choice",
          "type": "u8"
        }
      ]
    },
    {
      "name": "create_poll",
      "discriminator": [
        182,
        171,
        112,
        238,
        6,
        219,
        14,
        110
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "writable": true
        },
        {
          "name": "poll",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "project"
              },
              {
                "kind": "arg",
                "path": "options_hash"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "question_uri",
          "type": "string"
        },
        {
          "name": "options_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "end_ts",
          "type": "i64"
        },
        {
          "name": "mode",
          "type": "u8"
        }
      ]
    },
    {
      "name": "create_project",
      "discriminator": [
        148,
        219,
        181,
        42,
        221,
        114,
        145,
        190
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "slug"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "metadata_uri",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Subscription",
      "discriminator": [
        64,
        7,
        26,
        135,
        102,
        132,
        98,
        33
      ]
    },
    {
      "name": "Dataset",
      "discriminator": [
        242,
        85,
        87,
        90,
        234,
        188,
        241,
        17
      ]
    },
    {
      "name": "Poll",
      "discriminator": [
        110,
        234,
        167,
        188,
        231,
        136,
        153,
        111
      ]
    },
    {
      "name": "Project",
      "discriminator": [
        205,
        168,
        189,
        202,
        181,
        247,
        142,
        19
      ]
    },
    {
      "name": "VoteReceipt",
      "discriminator": [
        104,
        20,
        204,
        252,
        45,
        84,
        37,
        195
      ]
    }
  ],
  "events": [
    {
      "name": "SubscriptionUpdated",
      "discriminator": [
        51,
        157,
        221,
        95,
        183,
        199,
        243,
        218
      ]
    },
    {
      "name": "DatasetAdded",
      "discriminator": [
        15,
        1,
        3,
        7,
        54,
        123,
        17,
        241
      ]
    },
    {
      "name": "PollCreated",
      "discriminator": [
        137,
        85,
        250,
        148,
        2,
        9,
        178,
        39
      ]
    },
    {
      "name": "ProjectCreated",
      "discriminator": [
        192,
        10,
        163,
        29,
        185,
        31,
        67,
        168
      ]
    },
    {
      "name": "VoteCast",
      "discriminator": [
        39,
        53,
        195,
        104,
        188,
        17,
        225,
        213
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "SlugTooLong",
      "msg": "Slug too long"
    },
    {
      "code": 6001,
      "name": "MetadataUriTooLong",
      "msg": "Metadata URI too long"
    },
    {
      "code": 6002,
      "name": "DataUriTooLong",
      "msg": "Data URI too long"
    },
    {
      "code": 6003,
      "name": "QuestionUriTooLong",
      "msg": "Question URI too long"
    },
    {
      "code": 6004,
      "name": "UnauthorizedAuthority",
      "msg": "Unauthorized authority"
    },
    {
      "code": 6005,
      "name": "MathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6006,
      "name": "InvalidPollMode",
      "msg": "Invalid poll mode"
    },
    {
      "code": 6007,
      "name": "InvalidChoice",
      "msg": "Invalid vote choice"
    },
    {
      "code": 6008,
      "name": "PollAlreadyEnded",
      "msg": "Poll already ended"
    },
    {
      "code": 6009,
      "name": "PollEndInPast",
      "msg": "Poll end time must be in the future"
    }
  ],
  "types": [
    {
      "name": "Subscription",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "expires_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "Dataset",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "version",
            "type": "u32"
          },
          {
            "name": "content_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "data_uri",
            "type": "string"
          },
          {
            "name": "created_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "DatasetAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "dataset",
            "type": "pubkey"
          },
          {
            "name": "version",
            "type": "u32"
          },
          {
            "name": "created_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "Poll",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "question_uri",
            "type": "string"
          },
          {
            "name": "options_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "end_ts",
            "type": "i64"
          },
          {
            "name": "mode",
            "type": "u8"
          },
          {
            "name": "yes_votes",
            "type": "u64"
          },
          {
            "name": "no_votes",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "PollCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "end_ts",
            "type": "i64"
          },
          {
            "name": "mode",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Project",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "slug",
            "type": "string"
          },
          {
            "name": "metadata_uri",
            "type": "string"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "dataset_count",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "ProjectCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "slug",
            "type": "string"
          },
          {
            "name": "created_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "VoteCast",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "choice",
            "type": "u8"
          },
          {
            "name": "voted_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "VoteReceipt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "choice",
            "type": "u8"
          },
          {
            "name": "voted_at",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
