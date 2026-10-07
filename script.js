(() => {
  "use strict";

  const DEBUG = false;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const ASSET_META = new Map();

  const GAME_ASSETS = Object.freeze({
    player: {
      idle: "assets/characters/wizard_idle.png",
      cast: "assets/characters/wizard_cast.png"
    },
    mobs: {
      single: [
        {
          id: "skeleton_weak",
          src: "assets/mobs/mob_skeleton_weak_walk.png",
          label: "Esqueleto fraco"
        },
        {
          id: "zombie_thin",
          src: "assets/mobs/mob_zombie_thin_walk.png",
          label: "Zumbi magro"
        },
        {
          id: "elf_basic",
          src: "assets/mobs/mob_elf_basic_walk.png",
          label: "Elfo básico"
        }
      ],
      multi: {
        2: {
          id: "armored_skeleton_archer",
          src: "assets/mobs/mob_2runes_armored_skeleton_archer_walk.png",
          label: "Esqueleto arqueiro blindado"
        },
        3: {
          id: "orc",
          src: "assets/mobs/mob_3runes_orc_walk.png",
          label: "Orc"
        },
        4: {
          id: "elite_elf",
          src: "assets/mobs/mob_4runes_elite_elf_walk.png",
          label: "Elfo de elite"
        },
        5: {
          id: "mini_dragon",
          src: "assets/mobs/mob_5runes_mini_dragon_walk.png",
          label: "Mini dragão"
        }
      }
    },
    bosses: {
      wave1: {
        id: "fire_dragon_wave_01",
        src: "assets/boss/boss_wave_01_fire_dragon_walk.png",
        label: "Dragão de fogo"
      }
    },
    environment: {
      battlefield: "assets/environment/battlefield_bridge_castle_day.png"
    }
  });

  const GAME_CONFIG = {
    drawing: {
      samplePoints: 72,
      minPathLength: 28,
      minPoints: 5,
      recognitionThreshold: 0.62,
      straightLineRatio: 0.86,
      closedGestureRatio: 0.3,
      ambiguityDistanceMargin: 0.018,
      templateRotations: [-12, -6, 0, 6, 12],
      trailWidth: 4,
      trailDuration: 180
    },

    difficulty: {
      difficultyTierDuration: 10,
      baseEnemySpeed: 46,
      speedIncreasePerTier: 0.045,
      maxSpeedMultiplier: 2.05,
      randomSpeedVariation: 0.035
    },

    spawn: {
      initialInterval: 2.65,
      intervalReductionPerTier: 0.085,
      minimumInterval: 1.4,
      initialSingleEnemyLimit: 3,
      maxSingleEnemies: 4,
      singleEnemyLimitIncreaseTier: 3,
      maxMultiRuneEnemies: 2,
      maxNormalEnemiesTotal: 6,
      positionAttempts: 14,
      minHorizontalGap: 88
    },

    multiRune: {
      multiRuneStartTime: 30,
      unlockTimes: {
        2: 30,
        3: 90,
        4: 150,
        5: 210
      },
      distributions: [
        { minTime: 0, weights: { 1: 1 } },
        { minTime: 30, weights: { 1: 0.78, 2: 0.22 } },
        { minTime: 90, weights: { 1: 0.62, 2: 0.3, 3: 0.08 } },
        { minTime: 150, weights: { 1: 0.54, 2: 0.28, 3: 0.14, 4: 0.04 } },
        { minTime: 210, weights: { 1: 0.48, 2: 0.28, 3: 0.15, 4: 0.07, 5: 0.02 } }
      ],
      speedModifiers: {
        1: 1,
        2: 0.95,
        3: 0.9,
        4: 0.85,
        5: 0.8
      },
      scoreByRuneCount: {
        1: 50,
        2: 125,
        3: 220,
        4: 340,
        5: 500
      }
    },

    runes: {
      hardRuneStartTime: 20,
      hardRuneBaseChance: 0.08,
      hardRuneChancePerTier: 0.035,
      maxHardRuneChance: 0.28,
      preventConsecutiveDuplicate: true
    },

    boss: {
      firstBossTime: 60,
      bossInterval: 90,
      warningDuration: 2.4,
      postBossDelay: 2.6,
      firstBossRuneCount: 10,
      bossRuneIncreasePerCycle: 1,
      maxBossRuneCount: 15,
      baseBossSpeed: 20.6,
      bossSpeedIncreasePerCycle: 1.15,
      maxBossSpeed: 27.5
    },

    battlefield: {
      // Coordenadas horizontais normalizadas na imagem original do cenário.
      // A conversão para a tela considera automaticamente background-size: cover.
      bridgeLeftRatio: 0.34,
      bridgeRightRatio: 0.68,
      horizontalPadding: 10,

      // Posição do mago relativa à área útil abaixo do HUD.
      playerXRatio: 0.5,
      playerYRatio: 0.685,

      // Linha em que o inimigo deixa a ponte e o castelo recebe dano.
      castleImpactYRatio: 0.56,
      bossImpactYRatio: 0.515,

      // Deve permanecer sincronizado com o CSS do background.
      backgroundPositionX: 0.5,
      backgroundPositionY: 1
    },

    sprites: {
      frameCount: 4,
      normalFrameSize: 64,
      bossFrameSize: 128,
      normalDisplaySize: 64,
      miniDragonDisplaySize: 76,
      bossDisplaySize: 128,
      playerDisplaySize: 76,
      walkCycleDuration: 520,
      bossWalkCycleDuration: 620,
      playerIdleCycleDuration: 620,
      playerCastDuration: 460,
      deathDuration: 300
    },

    spell: {
      projectileDuration: 300,
      attackAnimationDuration: 460,
      originXRatio: 0.72,
      originYRatio: 0.34
    },

    castle: {
      maxLives: 3
    }
  };

  const RUNE_DEFINITIONS = {
    EASY_Z: {
      id: "EASY_Z",
      friendlyName: "Z",
      category: "easy",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[4, 5], [20, 5], [5, 19], [20, 19]]]
      },
      templates: [
        [[-1, -0.82], [1, -0.82], [-0.92, 0.82], [1, 0.82]],
        [[-1, -0.72], [0.9, -0.78], [-0.78, 0.9], [1, 0.82]],
        [[-0.92, -0.9], [1, -0.75], [-1, 0.72], [0.92, 0.9]]
      ]
    },

    EASY_N: {
      id: "EASY_N",
      friendlyName: "N",
      category: "easy",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[6, 19], [6, 5], [12, 14], [18, 19], [18, 5]]]
      },
      templates: [
        [[-0.82, 1], [-0.82, -1], [0.0, 0.25], [0.82, 1], [0.82, -1]],
        [[-0.72, 1], [-0.78, -0.92], [0.08, 0.18], [0.9, 0.95], [0.82, -1]],
        [[-0.9, 0.95], [-0.82, -1], [-0.08, 0.1], [0.78, 1], [0.9, -0.9]]
      ]
    },

    EASY_VERTICAL: {
      id: "EASY_VERTICAL",
      friendlyName: "Linha vertical",
      category: "easy",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[12, 4], [12, 20]]]
      },
      templates: [
        [[0, -1], [0, 1]],
        [[-0.06, -1], [0.02, 0], [0.08, 1]],
        [[0.08, -1], [0.0, 0], [-0.05, 1]]
      ]
    },

    EASY_HORIZONTAL: {
      id: "EASY_HORIZONTAL",
      friendlyName: "Linha horizontal",
      category: "easy",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[4, 12], [20, 12]]]
      },
      templates: [
        [[-1, 0], [1, 0]],
        [[-1, -0.05], [0, 0.02], [1, 0.07]],
        [[-1, 0.08], [0, 0], [1, -0.06]]
      ]
    },

    EASY_U: {
      id: "EASY_U",
      friendlyName: "U",
      category: "easy",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[6, 5], [5, 9], [5, 14], [7, 18], [10, 20], [14, 20], [17, 18], [19, 14], [19, 5]]]
      },
      templates: [
        [[-0.82, -1], [-0.95, -0.45], [-0.92, 0.3], [-0.65, 0.78], [-0.25, 1], [0.28, 1], [0.68, 0.78], [0.92, 0.28], [0.82, -1]],
        [[-0.72, -1], [-0.9, -0.35], [-0.85, 0.42], [-0.48, 0.88], [0, 1], [0.48, 0.88], [0.85, 0.4], [0.75, -1]],
        [[-0.92, -0.92], [-1, -0.28], [-0.88, 0.5], [-0.52, 0.92], [-0.1, 1], [0.38, 0.92], [0.76, 0.55], [0.95, -0.88]]
      ]
    },

    EASY_V: {
      id: "EASY_V",
      friendlyName: "V",
      category: "easy",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[5, 5], [12, 19], [19, 5]]]
      },
      templates: [
        [[-1, -1], [0, 1], [1, -1]],
        [[-0.9, -1], [-0.08, 0.95], [1, -0.82]],
        [[-1, -0.82], [0.1, 1], [0.86, -1]]
      ]
    },

    EASY_CARET: {
      id: "EASY_CARET",
      friendlyName: "Chevron para cima",
      category: "easy",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[5, 19], [12, 5], [19, 19]]]
      },
      templates: [
        [[-1, 1], [0, -1], [1, 1]],
        [[-0.9, 1], [0.08, -0.95], [1, 0.82]],
        [[-1, 0.82], [-0.08, -1], [0.88, 1]]
      ]
    },

    HARD_01: {
      id: "HARD_01",
      friendlyName: "Símbolo difícil 01",
      category: "hard",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[
          [7, 21], [7, 12], [7, 9], [4.5, 8.5], [3.5, 6.2], [4.2, 4],
          [7.2, 4.8], [7.2, 9.5], [16.5, 9.5], [16.5, 6.5], [18, 4.5],
          [20.5, 5], [21, 7], [19, 9.5], [16.5, 9.5], [16.5, 15], [18, 20]
        ]]
      },
      templates: [
        [[-0.55, 1], [-0.55, 0.2], [-0.58, -0.2], [-0.9, -0.25], [-1, -0.6], [-0.82, -0.9], [-0.48, -0.72], [-0.48, -0.15], [0.4, -0.15], [0.4, -0.55], [0.62, -0.88], [0.92, -0.78], [1, -0.46], [0.72, -0.15], [0.4, -0.15], [0.4, 0.48], [0.62, 1]],
        [[-0.62, 1], [-0.6, 0.28], [-0.58, -0.12], [-0.88, -0.22], [-0.98, -0.55], [-0.76, -0.82], [-0.45, -0.68], [-0.46, -0.08], [0.36, -0.08], [0.38, -0.48], [0.58, -0.8], [0.9, -0.72], [0.98, -0.42], [0.7, -0.08], [0.38, -0.08], [0.42, 0.52], [0.6, 0.95]],
        [[-0.5, 0.95], [-0.52, 0.15], [-0.5, -0.28], [-0.82, -0.32], [-0.92, -0.65], [-0.72, -0.92], [-0.42, -0.76], [-0.42, -0.2], [0.46, -0.2], [0.46, -0.58], [0.68, -0.9], [0.96, -0.82], [1, -0.52], [0.78, -0.18], [0.46, -0.18], [0.46, 0.44], [0.66, 1]]
      ]
    },

    HARD_02: {
      id: "HARD_02",
      friendlyName: "Símbolo difícil 02",
      category: "hard",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[12, 3], [18, 8], [21, 11], [16, 14], [13, 21], [9, 15], [4, 11], [8, 7], [12, 3]]]
      },
      templates: [
        [[0, -1], [0.58, -0.48], [1, -0.08], [0.48, 0.28], [0.08, 1], [-0.35, 0.35], [-1, -0.05], [-0.48, -0.52], [0, -1]],
        [[0.05, -1], [0.55, -0.55], [0.95, -0.1], [0.5, 0.2], [0.05, 0.95], [-0.4, 0.32], [-0.92, -0.08], [-0.5, -0.48], [0.05, -1]],
        [[-0.05, -0.95], [0.62, -0.42], [1, 0], [0.42, 0.32], [0, 1], [-0.45, 0.4], [-1, -0.02], [-0.55, -0.58], [-0.05, -0.95]]
      ]
    },

    HARD_03: {
      id: "HARD_03",
      friendlyName: "Símbolo difícil 03",
      category: "hard",
      asset: null,
      visual: {
        viewBox: "0 0 24 24",
        paths: [[[5, 5], [12, 10], [20, 18], [4, 21], [12, 10], [19, 5]]]
      },
      templates: [
        [[-0.78, -0.82], [0, -0.18], [1, 0.72], [-1, 1], [0, -0.18], [0.78, -0.82]],
        [[-0.92, -0.72], [-0.05, -0.15], [0.95, 0.68], [-1, 0.92], [-0.05, -0.15], [0.72, -0.95]],
        [[-0.72, -0.95], [0.08, -0.22], [1, 0.82], [-0.92, 1], [0.08, -0.22], [0.92, -0.7]]
      ]
    }
  };

  const EASY_RUNE_KEYS = [
    "EASY_Z",
    "EASY_N",
    "EASY_VERTICAL",
    "EASY_HORIZONTAL",
    "EASY_U",
    "EASY_V",
    "EASY_CARET"
  ];
  const HARD_RUNE_KEYS = ["HARD_01", "HARD_02", "HARD_03"];
  const VALID_RUNE_KEYS = [...EASY_RUNE_KEYS, ...HARD_RUNE_KEYS];

  const MOB_ART_CATALOG = {
    single: GAME_ASSETS.mobs.single.map((entry) => ({
      ...entry,
      frameSize: GAME_CONFIG.sprites.normalFrameSize,
      displaySize: GAME_CONFIG.sprites.normalDisplaySize
    })),
    multi: {
      2: {
        ...GAME_ASSETS.mobs.multi[2],
        frameSize: GAME_CONFIG.sprites.normalFrameSize,
        displaySize: GAME_CONFIG.sprites.normalDisplaySize
      },
      3: {
        ...GAME_ASSETS.mobs.multi[3],
        frameSize: GAME_CONFIG.sprites.normalFrameSize,
        displaySize: GAME_CONFIG.sprites.normalDisplaySize
      },
      4: {
        ...GAME_ASSETS.mobs.multi[4],
        frameSize: GAME_CONFIG.sprites.normalFrameSize,
        displaySize: GAME_CONFIG.sprites.normalDisplaySize
      },
      5: {
        ...GAME_ASSETS.mobs.multi[5],
        frameSize: GAME_CONFIG.sprites.normalFrameSize,
        displaySize: GAME_CONFIG.sprites.miniDragonDisplaySize
      }
    },
    bossWave1: {
      ...GAME_ASSETS.bosses.wave1,
      frameSize: GAME_CONFIG.sprites.bossFrameSize,
      displaySize: GAME_CONFIG.sprites.bossDisplaySize
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function debugLog(...args) {
    if (DEBUG) console.log("[Magic Castle]", ...args);
  }

  function getDifficultyTier(elapsed) {
    return Math.max(0, Math.floor(elapsed / GAME_CONFIG.difficulty.difficultyTierDuration));
  }

  function getTemporalSpeedMultiplier(elapsed) {
    const tier = getDifficultyTier(elapsed);
    return Math.min(
      1 + tier * GAME_CONFIG.difficulty.speedIncreasePerTier,
      GAME_CONFIG.difficulty.maxSpeedMultiplier
    );
  }

  function getEnemySpeed(elapsed, runeCount) {
    const config = GAME_CONFIG.difficulty;
    const temporalMultiplier = getTemporalSpeedMultiplier(elapsed);
    const randomMultiplier = 1 + (Math.random() * 2 - 1) * config.randomSpeedVariation;
    const runeCountModifier = GAME_CONFIG.multiRune.speedModifiers[runeCount] || 1;

    return config.baseEnemySpeed * temporalMultiplier * randomMultiplier * runeCountModifier;
  }

  function getBossSpeed(cycle) {
    const config = GAME_CONFIG.boss;

    return Math.min(
      config.maxBossSpeed,
      config.baseBossSpeed + Math.max(0, cycle - 1) * config.bossSpeedIncreasePerCycle
    );
  }

  function getSpawnInterval(elapsed) {
    const tier = getDifficultyTier(elapsed);
    const config = GAME_CONFIG.spawn;

    return Math.max(
      config.minimumInterval,
      config.initialInterval - tier * config.intervalReductionPerTier
    );
  }

  function getSingleEnemyLimit(elapsed) {
    const tier = getDifficultyTier(elapsed);
    const config = GAME_CONFIG.spawn;
    return tier >= config.singleEnemyLimitIncreaseTier
      ? config.maxSingleEnemies
      : config.initialSingleEnemyLimit;
  }

  function getHardRuneChance(elapsed) {
    const config = GAME_CONFIG.runes;

    if (elapsed < config.hardRuneStartTime) return 0;

    const tier = getDifficultyTier(elapsed);
    const startTier = Math.floor(
      config.hardRuneStartTime / GAME_CONFIG.difficulty.difficultyTierDuration
    );

    return Math.min(
      config.maxHardRuneChance,
      config.hardRuneBaseChance +
        Math.max(0, tier - startTier) * config.hardRuneChancePerTier
    );
  }

  function weightedChoice(weightMap) {
    const entries = Object.entries(weightMap).filter(([, weight]) => weight > 0);
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

    if (entries.length === 0 || totalWeight <= 0) return null;

    let roll = Math.random() * totalWeight;

    for (const [key, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return Number(key);
    }

    return Number(entries[entries.length - 1][0]);
  }

  function getRuneCountWeights(elapsed) {
    const distributions = GAME_CONFIG.multiRune.distributions;
    let selected = distributions[0];

    for (const distribution of distributions) {
      if (elapsed >= distribution.minTime) selected = distribution;
      else break;
    }

    return { ...selected.weights };
  }

  function getUnlockedRuneCounts(elapsed) {
    const result = [1];
    const unlockTimes = GAME_CONFIG.multiRune.unlockTimes;

    for (const count of [2, 3, 4, 5]) {
      if (elapsed >= unlockTimes[count]) result.push(count);
    }

    return result;
  }

  function chooseRuneCountByProgression(elapsed) {
    const weights = getRuneCountWeights(elapsed);
    const unlocked = new Set(getUnlockedRuneCounts(elapsed));

    for (const key of Object.keys(weights)) {
      if (!unlocked.has(Number(key))) weights[key] = 0;
    }

    return weightedChoice(weights) || 1;
  }

  function chooseRuneKey(pool, previousRune = null) {
    if (pool.length === 0) return null;
    if (!GAME_CONFIG.runes.preventConsecutiveDuplicate || !previousRune || pool.length === 1) {
      return randomChoice(pool);
    }

    const filtered = pool.filter((rune) => rune !== previousRune);
    return randomChoice(filtered.length > 0 ? filtered : pool);
  }

  function chooseSingleRune(elapsed) {
    const hardChance = getHardRuneChance(elapsed);

    if (hardChance > 0 && Math.random() < hardChance) {
      return randomChoice(HARD_RUNE_KEYS);
    }

    return randomChoice(EASY_RUNE_KEYS);
  }

  function buildEasyRuneSequence(runeCount) {
    const sequence = [];

    for (let index = 0; index < runeCount; index += 1) {
      const previousRune = sequence[sequence.length - 1] || null;
      sequence.push(chooseRuneKey(EASY_RUNE_KEYS, previousRune));
    }

    return sequence;
  }

  function buildEnemyRuneSequence(runeCount, elapsed) {
    if (runeCount === 1) {
      return [chooseSingleRune(elapsed)];
    }

    return buildEasyRuneSequence(runeCount);
  }

  function getEnemyScore(runeCount) {
    return GAME_CONFIG.multiRune.scoreByRuneCount[runeCount] || 50;
  }

  function getMobArtDefinition(runeCount, isBoss) {
    if (isBoss) return MOB_ART_CATALOG.bossWave1;
    if (runeCount === 1) return randomChoice(MOB_ART_CATALOG.single);
    return MOB_ART_CATALOG.multi[runeCount] || MOB_ART_CATALOG.multi[2];
  }

  function getEnemyContainerWidth(runeCount, isBoss, displaySize) {
    if (isBoss) {
      return Math.max(displaySize, Math.min(290, 26 + runeCount * 33));
    }

    if (runeCount <= 1) return displaySize;
    return Math.max(displaySize, Math.min(160, 16 + runeCount * 28));
  }

  function createRuneVisual(runeId, extraClass = "") {
    const definition = RUNE_DEFINITIONS[runeId];
    if (!definition) throw new Error(`Runa desconhecida: ${runeId}`);

    const holder = document.createElement("span");
    holder.className = `rune-visual${extraClass ? ` ${extraClass}` : ""}`;
    holder.dataset.runeId = runeId;
    holder.setAttribute("aria-label", definition.friendlyName);

    if (definition.asset) {
      const image = document.createElement("img");
      image.className = "rune-asset-image";
      image.alt = definition.friendlyName;
      image.src = definition.asset;
      holder.appendChild(image);
      return holder;
    }

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", definition.visual.viewBox || "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    for (const pathPoints of definition.visual.paths) {
      const polyline = document.createElementNS(SVG_NS, "polyline");
      polyline.setAttribute(
        "points",
        pathPoints.map(([x, y]) => `${x},${y}`).join(" ")
      );
      polyline.setAttribute("class", "rune-stroke");
      svg.appendChild(polyline);
    }

    holder.appendChild(svg);
    return holder;
  }

  function collectGameAssetPaths() {
    return [
      GAME_ASSETS.player.idle,
      GAME_ASSETS.player.cast,
      ...GAME_ASSETS.mobs.single.map((entry) => entry.src),
      ...Object.values(GAME_ASSETS.mobs.multi).map((entry) => entry.src),
      GAME_ASSETS.bosses.wave1.src,
      GAME_ASSETS.environment.battlefield
    ];
  }

  function preloadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        const metadata = {
          src,
          loaded: true,
          width: image.naturalWidth,
          height: image.naturalHeight
        };
        ASSET_META.set(src, metadata);
        resolve(metadata);
      };

      image.onerror = () => {
        const metadata = { src, loaded: false, width: 0, height: 0 };
        ASSET_META.set(src, metadata);
        resolve(metadata);
      };

      image.src = src;
    });
  }

  async function preloadGameAssets() {
    const uniquePaths = [...new Set(collectGameAssetPaths())];
    return Promise.all(uniquePaths.map((src) => preloadImage(src)));
  }

  class GestureRecognizer {
    constructor(definitions, config) {
      this.definitions = definitions;
      this.config = config;
      this.templates = [];
      this.buildTemplates(definitions);
    }

    buildTemplates(definitions) {
      Object.entries(definitions).forEach(([name, definition]) => {
        definition.templates.forEach((rawTemplate) => {
          const base = rawTemplate.map(([x, y]) => ({ x, y }));

          this.config.templateRotations.forEach((degrees) => {
            const rotated = this.rotate(base, degrees * Math.PI / 180);

            this.templates.push({
              name,
              points: this.normalize(this.resample(rotated, this.config.samplePoints))
            });

            this.templates.push({
              name,
              points: this.normalize(this.resample([...rotated].reverse(), this.config.samplePoints))
            });
          });
        });
      });
    }

    recognize(rawPoints) {
      if (
        rawPoints.length < this.config.minPoints ||
        this.pathLength(rawPoints) < this.config.minPathLength
      ) {
        return {
          name: null,
          confidence: 0,
          distance: Infinity,
          reason: "gesture-too-small"
        };
      }

      const simplified = this.removeClosePoints(rawPoints, 3);
      const metrics = this.getGestureMetrics(simplified);
      const candidateTemplates = this.getCandidateTemplates(metrics);

      if (candidateTemplates.length === 0) {
        return {
          name: null,
          confidence: 0,
          distance: Infinity,
          reason: "unsupported-shape"
        };
      }

      const points = this.normalize(this.resample(simplified, this.config.samplePoints));
      const bestByName = new Map();

      for (const template of candidateTemplates) {
        const distance = this.pathDistance(points, template.points);
        const current = bestByName.get(template.name);

        if (!current || distance < current.distance) {
          bestByName.set(template.name, { name: template.name, distance });
        }
      }

      const ranked = [...bestByName.values()].sort((a, b) => a.distance - b.distance);
      const best = ranked[0] || { name: null, distance: Infinity };
      const second = ranked[1] || null;
      const confidence = clamp(1 - best.distance / 0.62, 0, 1);
      const ambiguityGap = second ? second.distance - best.distance : Infinity;

      if (confidence < this.config.recognitionThreshold) {
        return {
          name: null,
          confidence,
          distance: best.distance,
          nearest: best.name,
          reason: "below-threshold"
        };
      }

      if (ambiguityGap < this.config.ambiguityDistanceMargin) {
        return {
          name: null,
          confidence,
          distance: best.distance,
          nearest: best.name,
          reason: "ambiguous-shape"
        };
      }

      return {
        name: best.name,
        confidence,
        distance: best.distance
      };
    }

    getCandidateTemplates(metrics) {
      if (metrics.isStraight) {
        if (metrics.width > metrics.height * 1.18) {
          return this.templates.filter((template) => template.name === "EASY_HORIZONTAL");
        }

        if (metrics.height > metrics.width * 1.18) {
          return this.templates.filter((template) => template.name === "EASY_VERTICAL");
        }

        return this.templates.filter((template) =>
          template.name === "EASY_HORIZONTAL" || template.name === "EASY_VERTICAL"
        );
      }

      if (metrics.isClosed) {
        return this.templates.filter((template) => template.name === "HARD_02");
      }

      const openRuneNames = [
        "EASY_Z",
        "EASY_N",
        "EASY_U",
        "EASY_V",
        "EASY_CARET",
        "HARD_01",
        "HARD_03"
      ];

      // Um losango desenhado com fechamento imperfeito ainda pode competir,
      // mas apenas se início e fim permanecerem relativamente próximos.
      if (metrics.closureRatio <= 0.48) {
        openRuneNames.push("HARD_02");
      }

      return this.templates.filter((template) => openRuneNames.includes(template.name));
    }

    getGestureMetrics(points) {
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const diagonal = Math.max(Math.hypot(width, height), 0.0001);
      const pathLength = Math.max(this.pathLength(points), 0.0001);
      const first = points[0];
      const last = points[points.length - 1];
      const endpointDistance = Math.hypot(last.x - first.x, last.y - first.y);
      const straightness = endpointDistance / pathLength;
      const closureRatio = endpointDistance / diagonal;

      return {
        width,
        height,
        straightness,
        closureRatio,
        isStraight: straightness >= this.config.straightLineRatio,
        isClosed: closureRatio <= this.config.closedGestureRatio
      };
    }

    removeClosePoints(points, minDistance) {
      if (points.length <= 2) return [...points];

      const result = [points[0]];

      for (let i = 1; i < points.length; i += 1) {
        const last = result[result.length - 1];

        if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= minDistance) {
          result.push(points[i]);
        }
      }

      if (result.length === 1) result.push(points[points.length - 1]);
      return result;
    }

    resample(points, targetCount) {
      if (points.length < 2) return points;

      const totalLength = this.pathLength(points);
      if (totalLength === 0) {
        return Array.from({ length: targetCount }, () => ({ ...points[0] }));
      }

      const interval = totalLength / (targetCount - 1);
      const source = points.map((point) => ({ x: point.x, y: point.y }));
      const result = [{ ...source[0] }];
      let accumulated = 0;
      let index = 1;

      while (index < source.length && result.length < targetCount) {
        const previous = source[index - 1];
        const current = source[index];
        const segment = Math.hypot(current.x - previous.x, current.y - previous.y);

        if (segment === 0) {
          index += 1;
          continue;
        }

        if (accumulated + segment >= interval) {
          const ratio = (interval - accumulated) / segment;
          const point = {
            x: previous.x + ratio * (current.x - previous.x),
            y: previous.y + ratio * (current.y - previous.y)
          };

          result.push(point);
          source.splice(index, 0, point);
          accumulated = 0;
          index += 1;
        } else {
          accumulated += segment;
          index += 1;
        }
      }

      while (result.length < targetCount) {
        result.push({ ...source[source.length - 1] });
      }

      return result.slice(0, targetCount);
    }

    normalize(points) {
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = maxX - minX;
      const height = maxY - minY;
      const size = Math.max(width, height, 0.0001);
      const aspect = Math.min(width, height) / size;
      const center = this.centroid(points);

      const scaleX = aspect > 0.22 ? Math.max(width, 0.0001) : size;
      const scaleY = aspect > 0.22 ? Math.max(height, 0.0001) : size;

      return points.map((point) => ({
        x: (point.x - center.x) / scaleX,
        y: (point.y - center.y) / scaleY
      }));
    }

    rotate(points, angle) {
      const center = this.centroid(points);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      return points.map((point) => {
        const x = point.x - center.x;
        const y = point.y - center.y;

        return {
          x: x * cos - y * sin + center.x,
          y: x * sin + y * cos + center.y
        };
      });
    }

    centroid(points) {
      const total = points.reduce(
        (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
        { x: 0, y: 0 }
      );

      return {
        x: total.x / points.length,
        y: total.y / points.length
      };
    }

    pathLength(points) {
      let length = 0;

      for (let index = 1; index < points.length; index += 1) {
        length += Math.hypot(
          points[index].x - points[index - 1].x,
          points[index].y - points[index - 1].y
        );
      }

      return length;
    }

    pathDistance(a, b) {
      const count = Math.min(a.length, b.length);
      let total = 0;

      for (let index = 0; index < count; index += 1) {
        total += Math.hypot(a[index].x - b[index].x, a[index].y - b[index].y);
      }

      return total / count;
    }
  }

  class DrawingSystem {
    constructor(canvas, recognizer, onGesture) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d");
      this.recognizer = recognizer;
      this.onGesture = onGesture;
      this.points = [];
      this.drawing = false;
      this.fadeFrame = null;
      this.boundResize = () => this.resize();
      this.bindEvents();
      this.resize();
    }

    bindEvents() {
      this.canvas.addEventListener("pointerdown", (event) => this.start(event));
      this.canvas.addEventListener("pointermove", (event) => this.move(event));
      this.canvas.addEventListener("pointerup", (event) => this.finish(event));
      this.canvas.addEventListener("pointercancel", (event) => this.finish(event));
      this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
      window.addEventListener("resize", this.boundResize);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.max(1, Math.round(rect.width * ratio));
      this.canvas.height = Math.max(1, Math.round(rect.height * ratio));
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.clear();
    }

    getPoint(event) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    start(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (this.fadeFrame) cancelAnimationFrame(this.fadeFrame);
      this.canvas.setPointerCapture?.(event.pointerId);
      this.drawing = true;
      this.points = [this.getPoint(event)];
      this.clear();
      event.preventDefault();
    }

    move(event) {
      if (!this.drawing) return;
      const coalesced = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
      coalesced.forEach((item) => this.points.push(this.getPoint(item)));
      this.renderStroke(1);
      event.preventDefault();
    }

    finish(event) {
      if (!this.drawing) return;
      this.drawing = false;

      if (this.canvas.hasPointerCapture?.(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }

      const result = this.recognizer.recognize(this.points);
      this.onGesture(result, [...this.points]);
      this.fadeTrail();
      event.preventDefault();
    }

    renderStroke(alpha) {
      const ctx = this.context;
      const width = this.canvas.getBoundingClientRect().width;
      const height = this.canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, width, height);

      if (this.points.length < 2) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = GAME_CONFIG.drawing.trailWidth + 5;
      ctx.strokeStyle = "rgba(130, 103, 214, 0.2)";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(192, 173, 255, 0.9)";
      this.strokePath(ctx);

      ctx.shadowBlur = 5;
      ctx.lineWidth = GAME_CONFIG.drawing.trailWidth;
      ctx.strokeStyle = "rgba(215, 203, 255, 0.98)";
      this.strokePath(ctx);
      ctx.restore();
    }

    strokePath(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);

      for (let i = 1; i < this.points.length; i += 1) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }

      ctx.stroke();
    }

    fadeTrail() {
      const startedAt = performance.now();
      const duration = GAME_CONFIG.drawing.trailDuration;

      const tick = (now) => {
        const progress = clamp((now - startedAt) / duration, 0, 1);
        this.renderStroke(1 - progress);

        if (progress < 1) {
          this.fadeFrame = requestAnimationFrame(tick);
        } else {
          this.fadeFrame = null;
          this.points = [];
          this.clear();
        }
      };

      this.fadeFrame = requestAnimationFrame(tick);
    }

    clear() {
      const rect = this.canvas.getBoundingClientRect();
      this.context.clearRect(0, 0, rect.width, rect.height);
    }
  }

  class Enemy {
    constructor(manager, { runes, x, y, speed, isBoss = false, wave = 1, artDefinition = null }) {
      this.manager = manager;
      this.runes = [...runes];
      this.runeIndex = 0;
      this.runeCount = this.runes.length;
      this.isHardRuneEnemy =
        !isBoss && this.runeCount === 1 && HARD_RUNE_KEYS.includes(this.runes[0]);
      this.x = x;
      this.y = y;
      this.speed = speed;
      this.isBoss = isBoss;
      this.wave = wave;
      this.dead = false;
      this.isTargeted = false;
      this.artDefinition = artDefinition || getMobArtDefinition(this.runeCount, this.isBoss);
      this.displaySize = this.artDefinition.displaySize;
      this.containerWidth = getEnemyContainerWidth(
        this.runeCount,
        this.isBoss,
        this.displaySize
      );
      this.element = this.createElement();
      this.manager.layer.appendChild(this.element);
      this.render();
    }

    createElement() {
      const wrapper = document.createElement("div");
      wrapper.className =
        `enemy enemy-runes-${Math.min(this.runeCount, 5)} ` +
        `enemy-art-${this.artDefinition.id}${this.isBoss ? " boss" : ""}` +
        `${this.isHardRuneEnemy ? " enemy-hard-rune" : ""}`;

      wrapper.dataset.runeCount = String(this.runeCount);
      wrapper.dataset.artKey = this.artDefinition.id;
      wrapper.dataset.enemyKind = this.isBoss ? "boss" : this.runeCount > 1 ? "multi" : "single";
      wrapper.dataset.enemyCategory = this.isBoss
        ? "boss"
        : this.isHardRuneEnemy
          ? "hard-rune"
          : this.runeCount > 1
            ? "multi-rune"
            : "easy-rune";
      wrapper.dataset.state = "alive";

      if (this.isBoss && this.wave === 1) {
        wrapper.classList.add("boss-wave-1");
      }

      wrapper.style.top = "0px";
      wrapper.style.left = "0px";
      wrapper.style.animation = "none";
      wrapper.style.width = `${this.containerWidth}px`;
      wrapper.style.setProperty("--enemy-display-size", `${this.displaySize}px`);
      wrapper.style.setProperty(
        "--enemy-walk-duration",
        `${this.isBoss
          ? GAME_CONFIG.sprites.bossWalkCycleDuration
          : GAME_CONFIG.sprites.walkCycleDuration}ms`
      );

      if (this.runeCount === 1 && !this.isBoss) {
        this.runeContainer = document.createElement("div");
        this.runeContainer.className = "enemy-symbol";
      } else {
        this.runeContainer = document.createElement("div");
        this.runeContainer.className = this.isBoss
          ? "boss-runes enemy-rune-strip"
          : "enemy-rune-strip";
      }

      wrapper.appendChild(this.runeContainer);
      this.renderRuneProgress();

      this.spriteElement = document.createElement("div");
      this.spriteElement.className = "enemy-sprite";
      this.spriteElement.dataset.spriteId = this.artDefinition.id;
      this.spriteElement.setAttribute(
        "aria-label",
        this.isBoss ? `Chefe: ${this.artDefinition.label}` : this.artDefinition.label
      );
      this.spriteElement.style.backgroundImage = `url("${this.artDefinition.src}")`;
      wrapper.appendChild(this.spriteElement);

      return wrapper;
    }

    renderRuneProgress() {
      if (!this.runeContainer) return;

      this.runeContainer.innerHTML = "";
      this.runeContainer.classList.toggle("completed", this.isComplete);

      if (this.runeCount === 1 && !this.isBoss) {
        const runeId = this.isComplete
          ? this.runes[this.runes.length - 1]
          : this.currentRune;

        if (!runeId) return;

        const visual = createRuneVisual(
          runeId,
          this.isComplete ? "rune-completed" : ""
        );

        this.runeContainer.appendChild(visual);
        return;
      }

      this.runes.forEach((runeId, index) => {
        const slot = document.createElement("span");
        slot.className = "enemy-rune-slot";

        if (index < this.runeIndex) {
          slot.classList.add("done");
        } else if (index === this.runeIndex && !this.isComplete) {
          slot.classList.add("current");
        }

        slot.appendChild(createRuneVisual(runeId));
        this.runeContainer.appendChild(slot);
      });
    }

    get currentRune() {
      return this.runes[this.runeIndex] || null;
    }

    get isComplete() {
      return this.runeIndex >= this.runes.length;
    }

    get centerX() {
      return this.x + this.containerWidth / 2;
    }

    processRuneHit() {
      if (this.dead || this.isComplete) {
        return {
          applied: false,
          completedRune: null,
          defeated: this.dead || this.isComplete,
          remainingRunes: Math.max(0, this.runes.length - this.runeIndex)
        };
      }

      const completedRune = this.currentRune;
      this.hit();
      this.runeIndex += 1;

      const defeated = this.runeIndex >= this.runes.length;
      this.renderRuneProgress();

      return {
        applied: true,
        completedRune,
        defeated,
        remainingRunes: Math.max(0, this.runes.length - this.runeIndex)
      };
    }

    update(dt) {
      if (this.dead) return;

      // Segurança permanente: mesmo que movimento lateral seja adicionado no futuro,
      // o centro visual da sprite continua dentro do piso útil da ponte.
      this.manager.clampEnemyToBridge(this);
      this.y += this.speed * dt;
      this.render();
    }

    render() {
      if (this.dead) return;
      this.element.style.transform =
        `translate3d(${Math.round(this.x)}px, ${Math.round(this.y)}px, 0)`;
    }

    hit() {
      if (this.dead) return;

      this.element.classList.remove("is-hit");
      void this.element.offsetWidth;
      this.element.classList.add("is-hit");

      window.setTimeout(() => {
        if (this.element?.isConnected) {
          this.element.classList.remove("is-hit");
        }
      }, 190);
    }

    destroy(animated = true) {
      if (this.dead) return false;

      this.dead = true;
      this.isTargeted = false;
      this.speed = 0;
      this.element.dataset.state = "dead";
      this.element.setAttribute("aria-hidden", "true");

      if (animated) {
        this.element.classList.add("is-dying");
        window.setTimeout(
          () => this.element.remove(),
          GAME_CONFIG.sprites.deathDuration
        );
      } else {
        this.element.remove();
      }

      return true;
    }
  }

  class EnemyManager {
    constructor(layer, game) {
      this.layer = layer;
      this.game = game;
      this.enemies = [];
      this.spawnAccumulator = 0;
    }

    reset() {
      this.enemies.forEach((enemy) => enemy.destroy(false));
      this.enemies = [];
      this.spawnAccumulator = 0;
    }

    getActiveMultiRuneEnemyCount() {
      return this.enemies.filter(
        (enemy) => !enemy.dead && !enemy.isBoss && enemy.runeCount > 1
      ).length;
    }

    getActiveSingleRuneEnemyCount() {
      return this.enemies.filter(
        (enemy) => !enemy.dead && !enemy.isBoss && enemy.runeCount === 1
      ).length;
    }

    getActiveNormalEnemyCount() {
      return this.enemies.filter(
        (enemy) => !enemy.dead && !enemy.isBoss
      ).length;
    }

    update(dt, elapsed, cycle, allowNormalSpawn) {
      this.enemies = this.enemies.filter((enemy) => !enemy.dead);

      for (const enemy of [...this.enemies]) {
        if (enemy.dead) continue;

        enemy.update(dt);

        const impactRatio = enemy.isBoss
          ? GAME_CONFIG.battlefield.bossImpactYRatio
          : GAME_CONFIG.battlefield.castleImpactYRatio;

        const bottomLimit =
          this.layer.clientHeight * impactRatio -
          enemy.displaySize * 0.35;

        if (!enemy.dead && enemy.y >= bottomLimit) {
          this.game.enemyReachedCastle(enemy);
        }
      }

      if (!allowNormalSpawn) return;

      const interval = getSpawnInterval(elapsed);
      this.spawnAccumulator += dt;

      if (this.spawnAccumulator >= interval) {
        this.spawnAccumulator = 0;
        const runeCount = this.chooseSpawnRuneCount(elapsed);

        if (runeCount !== null) {
          this.spawnNormal(elapsed, cycle, runeCount);
        }
      }
    }

    chooseSpawnRuneCount(elapsed) {
      const config = GAME_CONFIG.spawn;

      if (this.getActiveNormalEnemyCount() >= config.maxNormalEnemiesTotal) {
        return null;
      }

      const singleCount = this.getActiveSingleRuneEnemyCount();
      const multiCount = this.getActiveMultiRuneEnemyCount();
      const singleLimit = getSingleEnemyLimit(elapsed);
      let runeCount = chooseRuneCountByProgression(elapsed);

      if (runeCount > 1 && multiCount >= config.maxMultiRuneEnemies) {
        runeCount = 1;
      }

      if (runeCount === 1 && singleCount >= singleLimit) return null;
      if (runeCount > 1 && multiCount >= config.maxMultiRuneEnemies) return null;

      return runeCount;
    }

    spawnNormal(elapsed, cycle, runeCount) {
      const runes = buildEnemyRuneSequence(runeCount, elapsed);
      const artDefinition = getMobArtDefinition(runeCount, false);
      const containerWidth = getEnemyContainerWidth(
        runeCount,
        false,
        artDefinition.displaySize
      );
      const x = this.findSpawnX(false, containerWidth, artDefinition.displaySize);
      const speed = getEnemySpeed(elapsed, runeCount);

      const enemy = new Enemy(this, {
        runes,
        x,
        y: -Math.max(96, artDefinition.displaySize + 34),
        speed,
        wave: cycle,
        artDefinition
      });

      this.enemies.push(enemy);

      debugLog(
        "enemy spawned",
        `tier=${getDifficultyTier(elapsed)}`,
        `runes=${runeCount}`,
        runes,
        `art=${enemy.artDefinition.id}`,
        `speed=${speed.toFixed(1)}`,
        `spawn=${getSpawnInterval(elapsed).toFixed(2)}`,
        `hardChance=${getHardRuneChance(elapsed).toFixed(2)}`,
        `category=${enemy.isHardRuneEnemy ? "hard-rune" : runeCount > 1 ? "multi-rune" : "easy-rune"}`,
        `multiAlive=${this.getActiveMultiRuneEnemyCount()}`
      );

      return enemy;
    }

    clearNormalEnemies() {
      for (const enemy of [...this.enemies]) {
        if (!enemy.isBoss) {
          this.remove(enemy, true);
        }
      }
    }

    spawnBoss(runes, cycle, elapsed) {
      this.clearNormalEnemies();

      const artDefinition = getMobArtDefinition(runes.length, true);
      const containerWidth = getEnemyContainerWidth(
        runes.length,
        true,
        artDefinition.displaySize
      );
      const x = this.findSpawnX(true, containerWidth, artDefinition.displaySize);

      const boss = new Enemy(this, {
        runes,
        x,
        y: -Math.max(165, artDefinition.displaySize + 34),
        speed: getBossSpeed(cycle),
        isBoss: true,
        wave: cycle,
        artDefinition
      });

      this.enemies.push(boss);
      return boss;
    }

    getBackgroundCoverGeometry() {
      const layerWidth = this.layer.clientWidth;
      const layerHeight = this.layer.clientHeight;
      const config = GAME_CONFIG.battlefield;
      const metadata = ASSET_META.get(GAME_ASSETS.environment.battlefield);

      if (
        !metadata?.loaded ||
        !metadata.width ||
        !metadata.height ||
        layerWidth <= 0 ||
        layerHeight <= 0
      ) {
        return {
          renderedWidth: layerWidth,
          renderedHeight: layerHeight,
          offsetX: 0,
          offsetY: 0
        };
      }

      const scale = Math.max(
        layerWidth / metadata.width,
        layerHeight / metadata.height
      );
      const renderedWidth = metadata.width * scale;
      const renderedHeight = metadata.height * scale;

      return {
        renderedWidth,
        renderedHeight,
        offsetX: (layerWidth - renderedWidth) * config.backgroundPositionX,
        offsetY: (layerHeight - renderedHeight) * config.backgroundPositionY
      };
    }

    getBridgeCorridorPixels() {
      const config = GAME_CONFIG.battlefield;
      const layerWidth = this.layer.clientWidth;
      const geometry = this.getBackgroundCoverGeometry();

      let left =
        geometry.offsetX +
        geometry.renderedWidth * config.bridgeLeftRatio;
      let right =
        geometry.offsetX +
        geometry.renderedWidth * config.bridgeRightRatio;

      left = clamp(left, 0, layerWidth);
      right = clamp(right, 0, layerWidth);

      if (right < left) {
        [left, right] = [right, left];
      }

      return { left, right };
    }

    getBridgeCenterBounds(displaySize) {
      const config = GAME_CONFIG.battlefield;
      const corridor = this.getBridgeCorridorPixels();
      const halfSprite = displaySize / 2;
      const padding = config.horizontalPadding;
      const fallbackCenter = (corridor.left + corridor.right) / 2;

      const minCenter = corridor.left + halfSprite + padding;
      const maxCenter = corridor.right - halfSprite - padding;

      if (maxCenter < minCenter) {
        return {
          minCenter: fallbackCenter,
          maxCenter: fallbackCenter
        };
      }

      return { minCenter, maxCenter };
    }

    clampEnemyToBridge(enemy) {
      if (!enemy || enemy.dead) return;

      const bounds = this.getBridgeCenterBounds(enemy.displaySize);
      const currentCenter = enemy.x + enemy.containerWidth / 2;
      const safeCenter = clamp(
        currentCenter,
        bounds.minCenter,
        bounds.maxCenter
      );

      enemy.x = safeCenter - enemy.containerWidth / 2;
    }

    findSpawnX(isBoss, containerWidth, displaySize) {
      const bounds = this.getBridgeCenterBounds(displaySize);
      const centerOffset = containerWidth / 2;
      let candidateCenter = (bounds.minCenter + bounds.maxCenter) / 2;

      if (isBoss) {
        return candidateCenter - centerOffset;
      }

      let bestCenter = candidateCenter;
      let bestNearestDistance = -Infinity;

      for (
        let attempt = 0;
        attempt < GAME_CONFIG.spawn.positionAttempts;
        attempt += 1
      ) {
        candidateCenter =
          bounds.minCenter +
          Math.random() * Math.max(0, bounds.maxCenter - bounds.minCenter);

        const nearbyEnemies = this.enemies.filter(
          (enemy) => !enemy.dead && !enemy.isBoss && enemy.y <= 175
        );

        const nearestDistance = nearbyEnemies.length
          ? Math.min(
              ...nearbyEnemies.map((enemy) =>
                Math.abs(enemy.centerX - candidateCenter)
              )
            )
          : Infinity;

        if (nearestDistance >= GAME_CONFIG.spawn.minHorizontalGap) {
          return candidateCenter - centerOffset;
        }

        if (nearestDistance > bestNearestDistance) {
          bestNearestDistance = nearestDistance;
          bestCenter = candidateCenter;
        }
      }

      // Se a ponte estiver cheia, usa a melhor posição encontrada SEM sair do corredor.
      return bestCenter - centerOffset;
    }

    getNearestByRune(rune) {
      return (
        this.enemies
          .filter(
            (enemy) =>
              !enemy.dead &&
              !enemy.isBoss &&
              !enemy.isTargeted &&
              !enemy.isComplete &&
              enemy.currentRune === rune
          )
          .sort((a, b) => b.y - a.y)[0] || null
      );
    }

    processConfirmedRuneHit(enemy) {
      if (
        !enemy ||
        enemy.dead ||
        enemy.isBoss ||
        !this.enemies.includes(enemy)
      ) {
        return {
          applied: false,
          defeated: false,
          scoreAwarded: 0
        };
      }

      const result = enemy.processRuneHit();

      if (!result.applied) {
        return {
          ...result,
          scoreAwarded: 0
        };
      }

      if (!result.defeated) {
        return {
          ...result,
          scoreAwarded: 0
        };
      }

      const scoreAwarded = getEnemyScore(enemy.runeCount);
      this.game.addScore(scoreAwarded);
      this.remove(enemy, true);

      return {
        ...result,
        scoreAwarded
      };
    }

    remove(enemy, animated = true) {
      if (!enemy) return false;

      const removed = enemy.destroy(animated);
      this.enemies = this.enemies.filter((item) => item !== enemy);
      return removed;
    }
  }

  class SpellSystem {
    constructor(gameElement, effectsLayer, player, playerSprite) {
      this.gameElement = gameElement;
      this.effectsLayer = effectsLayer;
      this.player = player;
      this.playerSprite = playerSprite;
      this.castStateToken = 0;
      this.castTimeout = null;
    }

    cast(target, onHit) {
      if (
        !target ||
        target.dead ||
        target.isTargeted ||
        !target.element?.isConnected
      ) {
        return false;
      }

      target.isTargeted = true;
      this.animatePlayerAttack();

      const projectile = document.createElement("div");
      projectile.className = "spell-projectile";
      this.effectsLayer.appendChild(projectile);

      const gameRect = this.gameElement.getBoundingClientRect();
      const start = this.getProjectileOrigin(gameRect);
      const startedAt = performance.now();
      const duration = GAME_CONFIG.spell.projectileDuration;
      let finished = false;

      const finish = (didHit, destination = null) => {
        if (finished) return;
        finished = true;

        projectile.remove();

        if (!target.dead) {
          target.isTargeted = false;
        }

        if (
          !didHit ||
          target.dead ||
          !target.element?.isConnected ||
          !destination
        ) {
          return;
        }

        this.createImpact(destination.x, destination.y);

        if (typeof onHit === "function") {
          onHit();
        }
      };

      const tick = (now) => {
        if (
          target.dead ||
          !target.element?.isConnected
        ) {
          finish(false);
          return;
        }

        const targetRect = target.element.getBoundingClientRect();
        const destination = {
          x:
            targetRect.left +
            targetRect.width / 2 -
            gameRect.left,
          y:
            targetRect.top +
            targetRect.height * 0.62 -
            gameRect.top
        };

        const progress = clamp((now - startedAt) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 2);

        projectile.style.left =
          `${lerp(start.x, destination.x, eased)}px`;
        projectile.style.top =
          `${lerp(start.y, destination.y, eased)}px`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          finish(true, destination);
        }
      };

      requestAnimationFrame(tick);
      return true;
    }

    getProjectileOrigin(gameRect) {
      const sourceRect = this.playerSprite?.getBoundingClientRect() ||
        this.player.getBoundingClientRect();

      return {
        x:
          sourceRect.left +
          sourceRect.width * GAME_CONFIG.spell.originXRatio -
          gameRect.left,
        y:
          sourceRect.top +
          sourceRect.height * GAME_CONFIG.spell.originYRatio -
          gameRect.top
      };
    }

    animatePlayerAttack() {
      if (!this.playerSprite) return;

      const token = ++this.castStateToken;

      if (this.castTimeout) {
        window.clearTimeout(this.castTimeout);
      }

      this.player.classList.add("attacking");
      this.playerSprite.classList.remove("idle", "casting");
      this.playerSprite.style.backgroundImage =
        `url("${GAME_ASSETS.player.cast}")`;

      void this.playerSprite.offsetWidth;
      this.playerSprite.classList.add("casting");

      this.castTimeout = window.setTimeout(() => {
        if (token !== this.castStateToken) return;
        this.setIdleState();
      }, GAME_CONFIG.sprites.playerCastDuration);
    }

    setIdleState() {
      if (!this.playerSprite) return;

      this.player.classList.remove("attacking");
      this.playerSprite.classList.remove("casting");
      this.playerSprite.style.backgroundImage =
        `url("${GAME_ASSETS.player.idle}")`;
      this.playerSprite.classList.add("idle");
    }

    resetPlayerState() {
      this.castStateToken += 1;

      if (this.castTimeout) {
        window.clearTimeout(this.castTimeout);
        this.castTimeout = null;
      }

      this.setIdleState();
    }

    createImpact(x, y) {
      const impact = document.createElement("div");
      impact.className = "spell-impact";
      impact.style.left = `${x}px`;
      impact.style.top = `${y}px`;
      this.effectsLayer.appendChild(impact);

      window.setTimeout(
        () => impact.remove(),
        350
      );
    }
  }

  class BossManager {
    constructor(game, enemyManager) {
      this.game = game;
      this.enemyManager = enemyManager;
      this.state = "idle";
      this.boss = null;
      this.stateStartedAt = 0;
    }

    reset() {
      this.state = "idle";
      this.boss = null;
      this.stateStartedAt = 0;
    }

    get allowNormalSpawn() {
      return this.state === "idle";
    }

    update(elapsed, cycleElapsed) {
      const bossSpawnTime =
        this.game.cycle === 1
          ? GAME_CONFIG.boss.firstBossTime
          : GAME_CONFIG.boss.bossInterval;
      const warningStartTime = Math.max(0, bossSpawnTime - GAME_CONFIG.boss.warningDuration);

      if (this.state === "idle" && cycleElapsed >= warningStartTime) {
        this.state = "warning";
        this.stateStartedAt = elapsed;
        this.game.showBattleMessage("BOSS INCOMING");
        debugLog("boss warning", "cycle", this.game.cycle);
      }

      if (this.state === "warning" && cycleElapsed >= bossSpawnTime) {
        this.spawnBoss(elapsed);
      }

      if (
        this.state === "cooldown" &&
        elapsed - this.stateStartedAt >= GAME_CONFIG.boss.postBossDelay
      ) {
        this.state = "idle";
        this.boss = null;
        this.game.beginNextCycle();
      }
    }

    spawnBoss(elapsed) {
      const runeCount = Math.min(
        GAME_CONFIG.boss.maxBossRuneCount,
        GAME_CONFIG.boss.firstBossRuneCount +
          (this.game.cycle - 1) * GAME_CONFIG.boss.bossRuneIncreasePerCycle
      );
      const runes = buildEasyRuneSequence(runeCount);
      this.boss = this.enemyManager.spawnBoss(runes, this.game.cycle, elapsed);
      this.state = "active";
      this.stateStartedAt = elapsed;
      this.game.showBattleMessage("BOSS");
      debugLog("boss started", runes, "cycle", this.game.cycle);
    }

    tryRune(rune) {
      if (
        this.state !== "active" ||
        !this.boss ||
        this.boss.dead ||
        this.boss.isTargeted
      ) {
        return false;
      }

      if (rune !== this.boss.currentRune) return false;

      this.game.spellSystem.cast(this.boss, () => this.hitBoss());
      return true;
    }

    hitBoss() {
      if (!this.boss || this.boss.dead) return;

      const result = this.boss.processRuneHit();

      if (!result.applied) return;

      this.game.addScore(100);

      if (result.defeated) {
        this.defeatBoss();
      }
    }

    defeatBoss() {
      if (!this.boss) return;
      this.game.addScore(500);
      this.game.showBattleMessage("BOSS DEFEATED");
      this.enemyManager.remove(this.boss, true);
      this.state = "cooldown";
      this.stateStartedAt = this.game.elapsed;
      debugLog("boss defeated", "cycle", this.game.cycle);
    }
  }

  class GameManager {
    constructor() {
      this.gameElement = document.getElementById("game");
      this.battlefield = document.getElementById("battlefield");
      this.enemyLayer = document.getElementById("enemy-layer");
      this.player = document.getElementById("player");
      this.playerSprite = this.player.querySelector(".player-sprite");
      this.effectsLayer = document.getElementById("effects-layer");
      this.timerElement = document.getElementById("timer");
      this.waveElement = document.getElementById("wave");
      this.scoreElement = document.getElementById("score");
      this.livesElement = document.getElementById("lives");
      this.battleMessage = document.getElementById("battle-message");
      this.gameOverElement = document.getElementById("game-over");
      this.finalScoreElement = document.getElementById("final-score");
      this.restartButton = document.getElementById("restart-button");

      this.applyVisualAssets();

      this.recognizer = new GestureRecognizer(RUNE_DEFINITIONS, GAME_CONFIG.drawing);
      this.enemyManager = new EnemyManager(this.enemyLayer, this);
      this.spellSystem = new SpellSystem(
        this.gameElement,
        this.effectsLayer,
        this.player,
        this.playerSprite
      );
      this.bossManager = new BossManager(this, this.enemyManager);
      this.drawingSystem = new DrawingSystem(
        document.getElementById("drawing-layer"),
        this.recognizer,
        (result) => this.handleGesture(result)
      );

      this.running = true;
      this.elapsed = 0;
      this.score = 0;
      this.lives = GAME_CONFIG.castle.maxLives;
      this.cycle = 1;
      this.cycleStartedAt = 0;
      this.lastFrame = performance.now();
      this.lastTimerSecond = -1;
      this.lastDifficultyTier = 0;

      this.restartButton.addEventListener("click", () => this.restart());
      this.updateHud(true);

      window.setTimeout(() => {
        if (this.running && this.enemyManager.enemies.length === 0) {
          this.enemyManager.spawnNormal(this.elapsed, this.cycle, 1);
        }
      }, 850);

      requestAnimationFrame((time) => this.loop(time));
    }

    applyVisualAssets() {
      this.battlefield.style.setProperty(
        "--battlefield-image",
        `url("${GAME_ASSETS.environment.battlefield}")`
      );

      this.gameElement.style.setProperty(
        "--player-x",
        `${GAME_CONFIG.battlefield.playerXRatio * 100}%`
      );
      this.gameElement.style.setProperty(
        "--player-y",
        `${GAME_CONFIG.battlefield.playerYRatio * 100}%`
      );
      this.gameElement.style.setProperty(
        "--castle-impact-y",
        `${GAME_CONFIG.battlefield.castleImpactYRatio * 100}%`
      );
      this.gameElement.style.setProperty(
        "--player-display-size",
        `${GAME_CONFIG.sprites.playerDisplaySize}px`
      );

      if (this.playerSprite) {
        this.playerSprite.style.backgroundImage =
          `url("${GAME_ASSETS.player.idle}")`;
        this.playerSprite.style.setProperty(
          "--player-idle-duration",
          `${GAME_CONFIG.sprites.playerIdleCycleDuration}ms`
        );
        this.playerSprite.style.setProperty(
          "--player-cast-duration",
          `${GAME_CONFIG.sprites.playerCastDuration}ms`
        );
        this.playerSprite.classList.remove("casting");
        this.playerSprite.classList.add("idle");
      }
    }

    loop(now) {
      const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
      this.lastFrame = now;

      if (this.running) {
        this.elapsed += dt;
        const cycleElapsed = this.elapsed - this.cycleStartedAt;
        const difficultyTier = getDifficultyTier(this.elapsed);

        if (difficultyTier !== this.lastDifficultyTier) {
          this.lastDifficultyTier = difficultyTier;
          debugLog(
            "difficulty tier",
            difficultyTier,
            "speedMultiplier",
            getTemporalSpeedMultiplier(this.elapsed).toFixed(2),
            "spawnInterval",
            getSpawnInterval(this.elapsed).toFixed(2)
          );
        }

        this.bossManager.update(this.elapsed, cycleElapsed);
        this.enemyManager.update(
          dt,
          this.elapsed,
          this.cycle,
          this.bossManager.allowNormalSpawn
        );
        this.updateHud(false);
      }

      requestAnimationFrame((time) => this.loop(time));
    }

    handleGesture(result) {
      if (!this.running) return;

      debugLog(
        "gesture",
        result.name || result.nearest || "none",
        `${Math.round((result.confidence || 0) * 100)}%`,
        result.reason || "recognized"
      );

      if (!result.name) return;

      if (this.bossManager.state === "active") {
        const accepted = this.bossManager.tryRune(result.name);
        if (accepted) debugLog("boss rune accepted", result.name);
        return;
      }

      const target = this.enemyManager.getNearestByRune(result.name);
      if (!target) return;

      debugLog(
        "target selected",
        result.name,
        `runeCount=${target.runeCount}`,
        `riskY=${Math.round(target.y)}`
      );

      this.spellSystem.cast(target, () => {
        const hitResult = this.enemyManager.processConfirmedRuneHit(target);

        debugLog(
          "confirmed hit",
          `applied=${Boolean(hitResult.applied)}`,
          `defeated=${Boolean(hitResult.defeated)}`,
          `remaining=${hitResult.remainingRunes ?? "n/a"}`,
          `score=${hitResult.scoreAwarded || 0}`
        );
      });
    }

    enemyReachedCastle(enemy) {
      if (!this.running || enemy.dead) return;

      if (enemy.isBoss) {
        this.lives = 0;
      } else {
        this.lives = Math.max(0, this.lives - 1);
      }

      this.enemyManager.remove(enemy, false);

      const castle = document.getElementById("castle");
      castle.classList.remove("castle-hit");
      void castle.offsetWidth;
      castle.classList.add("castle-hit");
      window.setTimeout(() => castle.classList.remove("castle-hit"), 300);
      this.updateHud(true);

      if (this.lives <= 0) this.gameOver();
    }

    addScore(points) {
      this.score += points;
      this.updateHud(true);
    }

    beginNextCycle() {
      this.cycle += 1;
      this.cycleStartedAt = this.elapsed;
      this.enemyManager.spawnAccumulator = 0;
      this.showBattleMessage(`WAVE ${this.cycle}`);
      this.updateHud(true);
      debugLog("new cycle", this.cycle);
    }

    showBattleMessage(text) {
      this.battleMessage.textContent = text;
      this.battleMessage.classList.remove("show");
      void this.battleMessage.offsetWidth;
      this.battleMessage.classList.add("show");
    }

    updateHud(force) {
      const wholeSecond = Math.floor(this.elapsed);

      if (force || wholeSecond !== this.lastTimerSecond) {
        this.lastTimerSecond = wholeSecond;
        this.timerElement.textContent = formatTime(this.elapsed);
      }

      this.waveElement.textContent = `WAVE ${this.cycle}`;
      this.scoreElement.textContent = `SCORE: ${String(this.score).padStart(6, "0")}`;
      this.livesElement.textContent = Array.from(
        { length: GAME_CONFIG.castle.maxLives },
        (_, index) => (index < this.lives ? "♥" : "♡")
      ).join(" ");
    }

    gameOver() {
      this.running = false;
      this.finalScoreElement.textContent = `SCORE: ${String(this.score).padStart(6, "0")}`;
      this.gameOverElement.hidden = false;
      debugLog("game over");
    }

    restart() {
      this.enemyManager.reset();
      this.effectsLayer.innerHTML = "";
      this.bossManager.reset();
      this.spellSystem.resetPlayerState();
      this.elapsed = 0;
      this.score = 0;
      this.lives = GAME_CONFIG.castle.maxLives;
      this.cycle = 1;
      this.cycleStartedAt = 0;
      this.lastFrame = performance.now();
      this.lastTimerSecond = -1;
      this.lastDifficultyTier = 0;
      this.running = true;
      this.gameOverElement.hidden = true;
      this.drawingSystem.points = [];
      this.drawingSystem.clear();
      this.updateHud(true);
      this.showBattleMessage("WAVE 1");

      window.setTimeout(() => {
        if (this.running && this.enemyManager.enemies.length === 0) {
          this.enemyManager.spawnNormal(this.elapsed, this.cycle, 1);
        }
      }, 700);
    }
  }

  window.GAME_CONFIG = GAME_CONFIG;
  window.MAGIC_CASTLE_RUNES = RUNE_DEFINITIONS;
  window.MAGIC_CASTLE_RUNE_GROUPS = {
    easy: [...EASY_RUNE_KEYS],
    hard: [...HARD_RUNE_KEYS],
    all: [...VALID_RUNE_KEYS]
  };
  window.GAME_ASSETS = GAME_ASSETS;
  window.MAGIC_CASTLE_MOB_ARTS = MOB_ART_CATALOG;

  window.addEventListener("DOMContentLoaded", async () => {
    await preloadGameAssets();
    new GameManager();
  });
})();
