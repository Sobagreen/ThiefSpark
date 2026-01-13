// Auto-generated enemy database
window.ENEMY_DB = {
  cards: {
  "jab": {
    "id": "jab",
    "name": "Короткий выпад",
    "type": "attack",
    "emoji": "🥊",
    "baseDamage": 2
  },
  "slash": {
    "id": "slash",
    "name": "Серповидный разрез",
    "type": "attack",
    "emoji": "🥊",
    "baseDamage": 3
  },
  "heavy": {
    "id": "heavy",
    "name": "Громовой удар",
    "type": "attack",
    "emoji": "🥊",
    "baseDamage": 5
  },
  "pierce": {
    "id": "pierce",
    "name": "Пронзающий луч",
    "type": "attack",
    "emoji": "🥊",
    "baseDamage": 3,
    "effect": "pierce"
  },
  "shatter": {
    "id": "shatter",
    "name": "Осколочный раскол",
    "type": "attack",
    "emoji": "🥊",
    "baseDamage": 2,
    "effect": "break",
    "breakAmount": 2
  },
  "drain": {
    "id": "drain",
    "name": "Стягивание света",
    "type": "attack",
    "emoji": "🥊",
    "baseDamage": 2,
    "effect": "drain",
    "healRatio": 0.5
  },
  "flare": {
    "id": "flare",
    "name": "Огненный отсвет",
    "type": "attack",
    "emoji": "🥊",
    "baseDamage": 2,
    "effect": "burn"
  },
  "mark": {
    "id": "mark",
    "name": "Зеркальная метка",
    "type": "spell",
    "emoji": "✨",
    "effect": "mark"
  },
  "weaken": {
    "id": "weaken",
    "name": "Смещение фокуса",
    "type": "spell",
    "emoji": "✨",
    "effect": "reduceOpponent"
  },
  "empower": {
    "id": "empower",
    "name": "Сбор резонанса",
    "type": "spell",
    "emoji": "✨",
    "effect": "empower"
  },
  "priority": {
    "id": "priority",
    "name": "Срыв ритма",
    "type": "spell",
    "emoji": "✨",
    "effect": "priority"
  },
  "guard": {
    "id": "guard",
    "name": "Гранёный щит",
    "type": "defense",
    "emoji": "🛡️",
    "block": 3,
    "reflect": 0
  },
  "barrier": {
    "id": "barrier",
    "name": "Призма защиты",
    "type": "defense",
    "emoji": "🛡️",
    "block": 4,
    "reflect": 0
  },
  "fortify": {
    "id": "fortify",
    "name": "Кристальный бастион",
    "type": "defense",
    "emoji": "🛡️",
    "block": 5,
    "reflect": 1
  }
},
  enemies: [
  {
    "id": "mirror_whelp",
    "name": "Зеркальный детёныш",
    "hp": 16,
    "tier": 1,
    "description": "Юркий осколок, нападающий рывками.",
    "assets": {
      "base": "enemies/mirror_whelp/skin.png",
      "attack": "enemies/mirror_whelp/attack.png",
      "hurt": "enemies/mirror_whelp/hurt.png"
    },
    "cardSet": [
      "jab",
      "slash",
      "guard",
      "pierce"
    ],
    "patterns": {
      "opener": [
        "jab",
        "guard",
        "jab"
      ],
      "default": [
        "slash",
        "jab",
        "guard"
      ],
      "enraged": [
        "slash",
        "slash",
        "pierce"
      ]
    },
    "files": {
      "profile": "enemies/mirror_whelp/profile.json",
      "cards": "enemies/mirror_whelp/cards.json",
      "patterns": "enemies/mirror_whelp/patterns.json"
    }
  },
  {
    "id": "prism_raider",
    "name": "Призматический налётчик",
    "hp": 18,
    "tier": 1,
    "description": "Ворует свет, пробивая оборону лучами.",
    "assets": {
      "base": "enemies/prism_raider/skin.png",
      "attack": "enemies/prism_raider/attack.png",
      "hurt": "enemies/prism_raider/hurt.png"
    },
    "cardSet": [
      "jab",
      "slash",
      "pierce",
      "mark",
      "guard",
      "shatter"
    ],
    "patterns": {
      "opener": [
        "mark",
        "slash",
        "jab"
      ],
      "default": [
        "pierce",
        "guard",
        "slash"
      ],
      "enraged": [
        "pierce",
        "slash",
        "shatter"
      ]
    },
    "files": {
      "profile": "enemies/prism_raider/profile.json",
      "cards": "enemies/prism_raider/cards.json",
      "patterns": "enemies/prism_raider/patterns.json"
    }
  },
  {
    "id": "shard_scout",
    "name": "Осколочный разведчик",
    "hp": 17,
    "tier": 1,
    "description": "Слаб в защите, но умеет сбивать ритм.",
    "assets": {
      "base": "enemies/shard_scout/skin.png",
      "attack": "enemies/shard_scout/attack.png",
      "hurt": "enemies/shard_scout/hurt.png"
    },
    "cardSet": [
      "jab",
      "slash",
      "weaken",
      "guard",
      "pierce"
    ],
    "patterns": {
      "opener": [
        "jab",
        "weaken",
        "jab"
      ],
      "default": [
        "slash",
        "guard",
        "jab"
      ],
      "enraged": [
        "slash",
        "pierce",
        "jab"
      ]
    },
    "files": {
      "profile": "enemies/shard_scout/profile.json",
      "cards": "enemies/shard_scout/cards.json",
      "patterns": "enemies/shard_scout/patterns.json"
    }
  },
  {
    "id": "glass_stalker",
    "name": "Стеклянный охотник",
    "hp": 20,
    "tier": 2,
    "description": "Любит метить цель перед серией ударов.",
    "assets": {
      "base": "enemies/glass_stalker/skin.png",
      "attack": "enemies/glass_stalker/attack.png",
      "hurt": "enemies/glass_stalker/hurt.png"
    },
    "cardSet": [
      "mark",
      "pierce",
      "shatter",
      "guard",
      "slash"
    ],
    "patterns": {
      "opener": [
        "mark",
        "pierce",
        "guard"
      ],
      "default": [
        "shatter",
        "slash",
        "pierce"
      ],
      "enraged": [
        "pierce",
        "pierce",
        "shatter"
      ]
    },
    "files": {
      "profile": "enemies/glass_stalker/profile.json",
      "cards": "enemies/glass_stalker/cards.json",
      "patterns": "enemies/glass_stalker/patterns.json"
    }
  },
  {
    "id": "shard_siren",
    "name": "Осколочная сирена",
    "hp": 19,
    "tier": 2,
    "description": "Смешивает ослабления с пламенными ударами.",
    "assets": {
      "base": "enemies/shard_siren/skin.png",
      "attack": "enemies/shard_siren/attack.png",
      "hurt": "enemies/shard_siren/hurt.png"
    },
    "cardSet": [
      "weaken",
      "flare",
      "guard",
      "empower",
      "drain",
      "pierce"
    ],
    "patterns": {
      "opener": [
        "weaken",
        "flare",
        "guard"
      ],
      "default": [
        "flare",
        "drain",
        "weaken"
      ],
      "enraged": [
        "flare",
        "pierce",
        "empower"
      ]
    },
    "files": {
      "profile": "enemies/shard_siren/profile.json",
      "cards": "enemies/shard_siren/cards.json",
      "patterns": "enemies/shard_siren/patterns.json"
    }
  },
  {
    "id": "radiant_duelist",
    "name": "Сияющий дуэлянт",
    "hp": 21,
    "tier": 2,
    "description": "Берёт инициативу и отвечает выпадом.",
    "assets": {
      "base": "enemies/radiant_duelist/skin.png",
      "attack": "enemies/radiant_duelist/attack.png",
      "hurt": "enemies/radiant_duelist/hurt.png"
    },
    "cardSet": [
      "priority",
      "slash",
      "pierce",
      "guard",
      "shatter"
    ],
    "patterns": {
      "opener": [
        "priority",
        "slash",
        "guard"
      ],
      "default": [
        "slash",
        "pierce",
        "guard"
      ],
      "enraged": [
        "pierce",
        "slash",
        "shatter"
      ]
    },
    "files": {
      "profile": "enemies/radiant_duelist/profile.json",
      "cards": "enemies/radiant_duelist/cards.json",
      "patterns": "enemies/radiant_duelist/patterns.json"
    }
  },
  {
    "id": "dusk_bastion",
    "name": "Сумрачный бастион",
    "hp": 23,
    "tier": 2,
    "description": "Медленно разгоняется и давит оборону.",
    "assets": {
      "base": "enemies/dusk_bastion/skin.png",
      "attack": "enemies/dusk_bastion/attack.png",
      "hurt": "enemies/dusk_bastion/hurt.png"
    },
    "cardSet": [
      "guard",
      "fortify",
      "shatter",
      "weaken",
      "slash",
      "pierce"
    ],
    "patterns": {
      "opener": [
        "guard",
        "shatter",
        "guard"
      ],
      "default": [
        "fortify",
        "slash",
        "weaken"
      ],
      "enraged": [
        "fortify",
        "shatter",
        "pierce"
      ]
    },
    "files": {
      "profile": "enemies/dusk_bastion/profile.json",
      "cards": "enemies/dusk_bastion/cards.json",
      "patterns": "enemies/dusk_bastion/patterns.json"
    }
  },
  {
    "id": "void_howler",
    "name": "Пустотный вой",
    "hp": 25,
    "tier": 3,
    "description": "Разрывает защиту и усиливает удары.",
    "assets": {
      "base": "enemies/void_howler/skin.png",
      "attack": "enemies/void_howler/attack.png",
      "hurt": "enemies/void_howler/hurt.png"
    },
    "cardSet": [
      "weaken",
      "pierce",
      "shatter",
      "mark",
      "heavy",
      "slash"
    ],
    "patterns": {
      "opener": [
        "weaken",
        "pierce",
        "shatter"
      ],
      "default": [
        "pierce",
        "slash",
        "mark"
      ],
      "enraged": [
        "pierce",
        "pierce",
        "heavy"
      ]
    },
    "files": {
      "profile": "enemies/void_howler/profile.json",
      "cards": "enemies/void_howler/cards.json",
      "patterns": "enemies/void_howler/patterns.json"
    }
  },
  {
    "id": "quartz_titan",
    "name": "Кварцевый титан",
    "hp": 28,
    "tier": 3,
    "description": "Тяжёлые удары и мощная защита.",
    "assets": {
      "base": "enemies/quartz_titan/skin.png",
      "attack": "enemies/quartz_titan/attack.png",
      "hurt": "enemies/quartz_titan/hurt.png"
    },
    "cardSet": [
      "fortify",
      "heavy",
      "shatter",
      "guard",
      "pierce"
    ],
    "patterns": {
      "opener": [
        "fortify",
        "heavy",
        "guard"
      ],
      "default": [
        "heavy",
        "shatter",
        "guard"
      ],
      "enraged": [
        "heavy",
        "pierce",
        "heavy"
      ]
    },
    "files": {
      "profile": "enemies/quartz_titan/profile.json",
      "cards": "enemies/quartz_titan/cards.json",
      "patterns": "enemies/quartz_titan/patterns.json"
    }
  },
  {
    "id": "echo_juggernaut",
    "name": "Гигант эха",
    "hp": 30,
    "tier": 3,
    "description": "Финальный разрушитель, ставит метку перед финалом.",
    "assets": {
      "base": "enemies/echo_juggernaut/skin.png",
      "attack": "enemies/echo_juggernaut/attack.png",
      "hurt": "enemies/echo_juggernaut/hurt.png"
    },
    "cardSet": [
      "mark",
      "heavy",
      "pierce",
      "shatter",
      "guard"
    ],
    "patterns": {
      "opener": [
        "mark",
        "heavy",
        "guard"
      ],
      "default": [
        "heavy",
        "shatter",
        "pierce"
      ],
      "enraged": [
        "heavy",
        "pierce",
        "pierce"
      ]
    },
    "files": {
      "profile": "enemies/echo_juggernaut/profile.json",
      "cards": "enemies/echo_juggernaut/cards.json",
      "patterns": "enemies/echo_juggernaut/patterns.json"
    }
  }
]
};
