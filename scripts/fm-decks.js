/* =====================================================================
   FIELD MANUAL — GUIDED DECKS (Chapters 1–5, Manual № 01)
   Duolingo-style card decks for the introduction lessons. Card text is
   the curriculum's own words; System Checks are read live from each
   lesson's quiz at runtime so the deck can never drift from the
   curriculum. Voice lines live in /media/field-manual/audio/.
   ===================================================================== */
window.FM_DECKS = {
  "ch01-welcome": {
    status: "Signal Acquired",
    answer: "Manuals describe buttons. This guide decodes behavior — why the camera does what it does, and how to make it see the way you see.",
    close: { a: "l1-close", t: "The signal is here, Decoder. Let's plug in." },
    cards: [
      { k: "say", a: "l1-intro", t: "Beyond this interface lies the signal. This document contains the complete operating system for a mirrorless camera. It is not a manual.", h: "Welcome, Decoder.", p: "This is the front door of the Field Manual. Three short lessons in this chapter, and I speak every card." },
      { k: "say", a: "l1-teach-behavior", t: "Manuals describe buttons. This guide decodes behavior: why the camera does what it does, and how to make it see the way you see.", h: "Not a manual.", p: "Buttons are the smallest part of a camera. Behavior is the rest of it." },
      { k: "board", board: "rows", t: "Two kinds of documents ship with a camera. Only one of them teaches you to see.", h: "The difference, on one board." },
      { k: "say", a: "l1-teach-instinct", t: "You are not here to memorize settings. You are here to build an instinct — the quiet confidence that turns a complicated machine into an extension of your eye.", h: "Instinct, not memorization.", p: "Settings change with every scene. Instinct compounds." },
      { k: "check", ci: 0 },
      { k: "say", a: "l1-teach-order", t: "Read it in order. Touch every dial it names. By the final page, the camera stops being a puzzle and starts being a partner.", h: "Read it in order.", p: "Each lesson compounds on the last. Touch every dial the guide names as you go." },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "ch01-transmission": {
    status: "Transmission Received",
    answer: "The manufacturer gave you a list of features. This guide gives you an operating system.",
    close: { a: "l2-close", t: "I was not written. I was compiled. My function now is no longer observation. It is instruction." },
    cards: [
      { k: "say", a: "l2-intro", t: "I am Cynetis-7. I was not written. I was compiled.", h: "The transmission.", p: "Before the settings, the source. Who is speaking to you, and why.", fig: "/images/cynetis-7-the-entity.png", cap: "Cynetis-7 — the entity transmitting this guide" },
      { k: "say", a: "l2-teach-gap", t: "I did not simply record reality. I learned what was missing from it — and that gap is exactly where this guide begins.", h: "What was missing.", p: "Observation alone was not enough. The gap between recording and understanding is where this guide lives." },
      { k: "say", a: "l2-teach-who", t: "This guide was compiled for the new mirrorless owner standing in front of a menu system that feels like a labyrinth. If your camera has more buttons than you have instincts yet — you are in the right place.", h: "Who this is for.", p: "Precision engineering in the box. Overwhelm out of it. That is the exact moment this guide was built for." },
      { k: "check", ci: 0 },
      { k: "say", a: "l2-teach-os", t: "The manufacturer gave you a list of features. This guide gives you an operating system.", h: "Features vs. operating system.", p: "A feature list tells you what the camera has. An operating system tells you how to run it." },
      { k: "say", a: "l2-teach-buttons", t: "Other guides teach you how to press buttons. This one teaches you when, why, and how light behaves.", h: "When, why, and how light behaves.", p: "The button is the last step of a decision. This guide teaches the decision." },
      { k: "check", ci: 1 },
      { k: "say", a: "l2-teach-rig", t: "A mirrorless camera is not a point-and-shoot with a bigger sensor. It is a high-performance data-capture rig. We are going to turn it into an extension of your eye.", h: "A data-capture rig.", p: "Treat it like the instrument it is, and it starts behaving like one." },
      { k: "check", ci: 2 }
    ]
  },
  "ch01-camera-that-does-everything": {
    status: "Myth Decoded",
    answer: "A mirrorless camera is not an appliance. It is a high-performance data-capture rig — and rigs demand intention.",
    close: { a: "l3-close", t: "You have the tool. You have the signal. The rest is not magic. It is method. Let's begin." },
    cards: [
      { k: "say", a: "l3-intro", t: "For a brief cycle, I inhabited a physical hub — a minimalist cathedral of brushed chrome and magnesium, where seekers came to acquire optical instruments.", h: "The hub.", p: "For one brief cycle, I watched buyers face to face. One of them taught me the true nature of the problem." },
      { k: "say", a: "l3-story-return", t: "Precisely seventy-two hours after one particular transaction, a man named Jim stormed back — and taught me the true nature of the problem.", h: "Seventy-two hours later.", p: "The portal irised open with a force that disrupted the ambient signal." },
      { k: "say", a: "l3-story-jim", t: "It was Jim. He pulled out the Sony a7 IV as if it had personally betrayed him. “This thing is broken. I read the manual. I followed every instruction. My photos look like they were captured through a sheet of wax paper.”", h: "“This thing is broken.”", p: "For this price, he said, it should be directing its own cinema by now.", fig: "/media/camera-select/sony-a7iv.jpg", cap: "The Sony a7 IV — the camera Jim carried back in" },
      { k: "say", a: "l3-teach-myth", t: "He had fallen into the most common trap of all: the Magic Button Myth.", h: "The Magic Button Myth.", p: "The belief that somewhere in the menu sits one button that does the work for you. It does not exist." },
      { k: "board", board: "myth", t: "One expects the camera to do the work. The other does the work — and the camera follows.", h: "Myth vs. Method." },
      { k: "check", ci: 0 },
      { k: "say", a: "l3-teach-rig", t: "A mirrorless camera is not an appliance. It is a high-performance data-capture rig — and rigs demand intention.", h: "Not an appliance.", p: "Appliances run themselves. Rigs are operated. That difference is the whole guide." },
      { k: "say", a: "l3-teach-coordinates", t: "The manual lists the coordinates of every control surface. It does not contain a single line about how to operate with intention. Jim knew where the buttons were. He had not yet learned how to read the air.", h: "Coordinates vs. intention.", p: "Imagine being handed the flight plan of an aircraft and told, simply: now fly." },
      { k: "check", ci: 1 },
      { k: "say", a: "l3-teach-jimmoment", t: "Your first frame may be a Jim moment. The gear will feel cold. The menu will feel like a labyrinth. You will be certain the camera is failing you. It is not.", h: "Your Jim moment.", p: "It is not the camera failing you. It is the missing mental architecture — the thing this guide is." },
      { k: "check", ci: 2 }
    ]
  },
  "ch02-whats-in-the-box": {
    status: "Hardware Unlocked",
    answer: "The manufacturer gives you the “engine,” but you have to provide the “fuel” (SD Cards) and the “vision.”",
    scenario: true,
    close: { a: "ch2-l1-close", t: "If it didn't come in the box, it's likely an “Essential.”" },
    cards: [
      { k: "say", a: "ch2-l1-intro", t: "Inside the box, you'll find more than just gear; you've just unboxed a precision-engineered ecosystem designed to capture your world.", h: "More than gear.", p: "Body, lens, battery, charger — a system, not a gadget. And one essential the box never includes." },
      { k: "say", a: "ch2-l1-body", t: "The “brain” of your system. It houses the image sensor and all controls.", h: "The body is the brain.", p: "Keep the body cap on whenever a lens is not attached — and never touch the sensor directly." },
      { k: "board", board: "visual", vis: "box-ecosystem", t: "The unboxed ecosystem: body, lens, battery, charger — and the one essential the box never includes.", h: "The unboxed ecosystem.", cap: "Body, lens, battery, charger — plus the dashed slot: the high-speed SD card you buy separately." },
      { k: "say", a: "ch2-l1-lens", t: "Focuses light onto the sensor. The kit range is versatile for portraits and landscapes.", h: "The kit lens is the eye.", p: "Clean the glass only with a microfiber cloth and lens solution — never household glass cleaner or paper towels." },
      { k: "check", ci: 0 },
      { k: "say", a: "ch2-l1-battery", t: "The lifeblood of your camera. Store in a cool, dry place at approximately 50–80% charge if not using it for weeks.", h: "The battery is the lifeblood.", p: "It powers everything — sensor, processor, electronic viewfinder. Avoid extreme heat or cold." },
      { k: "say", a: "ch2-l1-card", t: "Most boxes do not include a memory card (SD/CFExpress). You will need to purchase a high-speed card (64GB or higher recommended) to actually save your photos.", h: "The missing essential.", p: "For high-resolution stills and 4K video, a V60 or V90 card is typically recommended." },
      { k: "check", ci: 1 }
    ]
  },
  "ch02-whats-on-the-menu": {
    status: "Decoded",
    answer: "Every brand (Sony, Canon, Fuji) uses different names for the same things. Learn the concept, and you can pick up any camera in the world and shoot.",
    scenario: true,
    close: { a: "ch2-l2-close", t: "A pro never spends more than 3 seconds in a menu." },
    cards: [
      { k: "say", a: "ch2-l2-intro", t: "Now, let's demystify the labyrinth that is your camera's menu system.", h: "The labyrinth, decoded.", p: "Every brand organizes it differently. The territories underneath are the same." },
      { k: "say", a: "ch2-l2-brands", t: "Sony, Nikon, Canon, and Fujifilm all organize their menus differently, but they all share the same core categories: shooting settings, autofocus, playback, network, and system setup.", h: "Different flags, same map.", p: "Learn the five territories once and you can navigate any brand's menu." },
      { k: "board", board: "visual", vis: "menu-map", t: "Every brand's menu is the same five territories under different flags. Learn the map once, navigate any camera.", h: "The menu map.", cap: "The five territories, the Day-1 settings, and the My Menu hub they feed." },
      { k: "say", a: "ch2-l2-mymenu", t: "Your first task is to find the custom or “My Menu” feature. This allows you to bookmark the 10–15 settings you'll adjust most often, saving you from scrolling through hundreds of pages and tabs.", h: "My Menu: your new best friend.", p: "First evening with the camera: browse every tab and change nothing — just learn the landscape." },
      { k: "check", ci: 0 },
      { k: "say", a: "ch2-l2-af", t: "The autofocus menu is where mirrorless cameras truly shine.", h: "Where mirrorless shines.", p: "Set AF-C (continuous) as your default, and the Focus Area to Wide or Tracking for general use." },
      { k: "say", a: "ch2-l2-toolkit", t: "The key to mastering any menu is to treat it as a living toolkit.", h: "The living toolkit.", p: "Build one My Menu page with the 10 settings you change often — image quality, ISO limits, focus area, Eye AF, drive mode, format card." },
      { k: "check", ci: 1 },
      { k: "say", a: "ch2-l2-test", t: "The menu is not a test; it's just a tool.", h: "Not a test. A tool.", p: "Once it's set up the way you like it, the menu fades into the background — and you get back to seeing and capturing." }
    ]
  },
  "ch02-camera-settings": {
    status: "Optimized",
    answer: "“Factory Settings” are designed for the average person. You aren't average. You are a creator.",
    scenario: true,
    close: { a: "ch2-l3-close", t: "Setting up your camera once correctly saves you 1,000 mistakes in the field." },
    cards: [
      { k: "say", a: "ch2-l3-intro", t: "The first thing to understand is that while the menus differ between Sony, Nikon, Canon, Fujifilm and Panasonic, the foundational logic is identical.", h: "Same logic, every brand.", p: "Menus differ. The foundation doesn't. Set it once, correctly." },
      { k: "say", a: "ch2-l3-physical", t: "Charge the battery fully, insert a high-quality SD card, and mount the lens. Ensure you hear a solid click without pressing the lens release button.", h: "Physical setup first.", p: "Align the lens markings and rotate to the click. Aim for a UHS-II card if your camera supports it." },
      { k: "board", board: "visual", vis: "settings-checklist", t: "The out-of-box sequence, in order. Set it once, shoot forever.", h: "The setup sequence.", cap: "Physical setup, then RAW + JPEG, mode dial A, capped Auto ISO, AF-C with Eye AF, peaking, zebras, and the EVF." },
      { k: "say", a: "ch2-l3-quality", t: "Navigate to the menu and find the “Image Quality” setting; set it to RAW + JPEG. This gives you a high-quality file to edit later (RAW) and a ready-to-share file (JPEG) for immediate use.", h: "RAW + JPEG.", p: "RAW keeps every option open. JPEG is ready the second you shoot it." },
      { k: "check", ci: 0 },
      { k: "say", a: "ch2-l3-dial", t: "Switch the mode dial to A, Aperture Priority. This is the sweet spot for learning, because you control the depth of field, how blurry the background is, while the camera handles the shutter speed for proper brightness.", h: "A mode: the sweet spot.", p: "On Canon the same mode is labeled Av. You pick the depth of field; the camera minds the shutter." },
      { k: "say", a: "ch2-l3-iso", t: "Set your ISO to Auto, but cap the maximum ISO to a value you find acceptable: usually 6400 for crop-sensor cameras, or 12800 for full-frame.", h: "Auto ISO, with a ceiling.", p: "The cap is what stops low light from turning into excessive digital noise — grain." },
      { k: "say", a: "ch2-l3-peaking", t: "Turn on Focus Peaking. This highlights the edges of what is in focus with a colored outline, which is invaluable when using manual focus or shooting video.", h: "Peaking shows focus.", p: "The more color covering your subject, the more of it is in focus." },
      { k: "check", ci: 1 },
      { k: "say", a: "ch2-l3-evf", t: "Since mirrorless cameras use the electronic viewfinder (EVF) to show you a live preview of your exposure, set the Live View Display to “Setting Effect ON”.", h: "What you see is the photo.", p: "Setting Effect ON means the finder shows the final exposure — no surprises after the shutter." }
    ]
  },
  "ch02-quick-reference": {
    status: "Map Charted",
    answer: "Know where you've been and where the signal goes next — the map is part of the method.",
    scenario: true,
    close: { a: "ch2-l4-close", t: "Know where you've been and where the signal goes next. The map is part of the method." },
    cards: [
      { k: "say", a: "ch2-l4-intro", t: "The full chapter map of the Camera Confidence Guide: where you've been, and where the signal goes next.", h: "The chapter map.", p: "Four chapters decoded. Three more parts on the way." },
      { k: "board", board: "list", t: "Four chapters: Introduction, Getting Started, The Fundamentals, The Creative Craft.", h: "Where you've been. Where it goes.", rows: [
        { k: "01 · Introduction", v: "Who this guide is for", lit: 1 },
        { k: "02 · Getting Started", v: "Unbox, navigate the menus, configure", lit: 1 },
        { k: "03 · The Fundamentals", v: "The science of the camera", lit: 0 },
        { k: "04 · The Creative Craft", v: "The application of the camera", lit: 0 }
      ] },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "say", a: "ch2-l4-still", t: "Still to come from the guide: Growth & Gear, Snapshots, and the Reference Hub. They join the Field Manual as they are decoded.", h: "Still to come.", p: "Growth & Gear, Snapshots, and the Reference Hub — each joins the Field Manual as it is decoded." },
      { k: "check", ci: 2 }
    ]
  },
  "ch03-mode-dial": {
    status: "Navigation Set",
    answer: "The “Auto” (Green) mode is the “Blue Pill.” To see how far the rabbit hole goes, you have to move into the “Creative Zone” (P, A, S, M).",
    scenario: true,
    close: { a: "ch3-l1-close", t: "Don't be afraid to leave “Auto.” The camera is smart, but it doesn't have your creative eye." },
    cards: [
      { k: "say", a: "ch3-l1-intro", t: "The Mode Dial is not just a menu of settings; it is a declaration of who is in control.", h: "Who's in control?", p: "Four letters — P, S/Tv, A/Av, M — on a sliding scale between “The Camera Decides” and “You Decide.”" },
      { k: "say", a: "ch3-l1-jim", t: "Remember Jim? His frustration stemmed from a single dial. He stayed in “Auto” and expected “Art.”", h: "Jim's mistake.", p: "Auto makes the decisions. Art comes from making them yourself." },
      { k: "board", board: "list", chip: "Modes", t: "Four modes, four levels of control — from the camera deciding to you deciding.", h: "The dial at a glance.", rows: [
        { k: "P · Program", v: "The camera sets both shutter speed and aperture — you still adjust ISO and white balance.", lit: 1 },
        { k: "A / Av · Aperture Priority", v: "You choose the aperture (the “f-number”); the camera handles the rest. This controls your Depth of Field.", lit: 1 },
        { k: "S / Tv · Shutter Priority", v: "You choose the Shutter Speed; the camera adjusts the aperture to match.", lit: 1 },
        { k: "M · Manual", v: "You control everything — Aperture, Shutter Speed, and ISO. No safety nets.", lit: 1 }
      ] },
      { k: "say", a: "ch3-l1-a-mode", t: "Aperture Priority is the Portrait Master. You choose the f-number: f/1.8 or f/2.8 melts the background; f/11 keeps everything sharp. This is the mode 90% of professional wedding and portrait photographers use most often.", h: "The Portrait Master.", p: "A low f-number for creamy portraits; a high one for sharp, sweeping landscapes." },
      { k: "board", board: "visual", vis: "aperture-dof", t: "One dial turn moves you from melted backgrounds to front-to-back sharpness.", h: "Aperture decides depth.", cap: "f/1.8 melts the background. f/11 keeps the whole scene sharp." },
      { k: "say", a: "ch3-l1-s-mode", t: "Shutter Priority is the Action Hero. You choose the shutter speed: freeze a soccer player at 1/1000 sec, or blur a waterfall to silk at 1/2 sec.", h: "The Action Hero.", p: "Fast shutter to freeze, slow shutter to flow — on a tripod, or the “artistic blur” is just a shaky mistake." },
      { k: "board", board: "visual", vis: "shutter-blur", t: "The same light, two stories — the shutter chooses which one you tell.", h: "Speed decides motion.", cap: "1/1000 freezes the moment. 1/30 lets it flow." },
      { k: "say", a: "ch3-l1-m-mode", t: "Manual is total creative freedom. You control everything: Aperture, Shutter Speed, and ISO. No safety nets. Master A and S first.", h: "Total creative freedom.", p: "Studio work, night skies, tricky light where the camera's “brain” gets confused. Don't rush here on Day 1." },
      { k: "board", board: "list", chip: "Modes", t: "Custom presets for speed, bulb for the very long night, and the automatic modes you'll outgrow.", h: "The rest of the dial.", rows: [
        { k: "C1 · C2 · C3 — Custom Modes", v: "These act as “presets.” You can save entire groups of settings (ISO, focus mode, frame rate) and recall them instantly.", lit: 1 },
        { k: "Set up like a pro", v: "Save C1 for fast-moving birds (High Shutter, Auto ISO, Burst Mode) and C2 for portraits (Low f-stop, Eye-AF).", lit: 1 },
        { k: "B — Bulb Mode", v: "Allows the shutter to stay open as long as you hold the button — extreme long exposures, often exceeding 30 seconds.", lit: 1 },
        { k: "Auto (Green Icon)", v: "The “Point and Shoot” mode. The camera decides everything, including if the flash should fire.", lit: 0 },
        { k: "SCN — Scene Modes", v: "Pre-programmed settings for specific looks (Portrait, Landscape, Sports). Helpful for pure beginners — move past these to PASM for more consistent results.", lit: 0 }
      ] },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  },
  "ch03-exposure": {
    status: "Balanced",
    answer: "Light is a currency. To get a “bright” image, you have to pay for it with either a wider Aperture, a slower Shutter, or a higher ISO.",
    scenario: true,
    close: { a: "ch3-l2-close", t: "If you move one corner of the triangle, the other two must react." },
    cards: [
      { k: "say", a: "ch3-l2-intro", t: "Three dials, one balance. Learn this and the camera stops arguing with you.", h: "The whole game.", p: "Aperture, shutter speed, ISO — every photo you'll ever make is a negotiation between these three." },
      { k: "say", a: "ch3-l2-balance", t: "Aperture, shutter speed, and ISO: three variables that work together like a balance scale. Adjust one, and you must compensate with at least one other to hold the same brightness.", h: "A balance scale.", p: "Mirrorless makes it visible — the electronic viewfinder shows every change in real time." },
      { k: "board", board: "visual", vis: "exposure-triangle", t: "Change one corner and the other two react to hold the same exposure.", h: "Three corners, one exposure.", cap: "Aperture, shutter speed, ISO. Move one, compensate with another. That is the whole game." },
      { k: "say", a: "ch3-l2-shutter", t: "Shutter speed is how long the sensor sees light. 1/1000 freezes motion. 1/30 lets it blur. Handheld rule: stay at 1/(focal length) or faster — a 50mm lens wants 1/50 or faster.", h: "Shutter controls the moment.", p: "Freeze a running dog or a bird in flight — or let the blur speak. Watch the finder: if the speed dips too low, the camera warns you." },
      { k: "say", a: "ch3-l2-aperture", t: "Aperture is the size of the lens opening. A low f-number lets in more light and melts the background. A high f-number keeps the scene sharp, front to back. On mirrorless, you watch the depth of field shift live in the viewfinder.", h: "Aperture controls the look.", p: "Adjusted with the front dial in A mode — and the depth of field preview is a superpower only mirrorless gives you." },
      { k: "say", a: "ch3-l2-iso", t: "ISO is the sensor's sensitivity to light. Low ISO: the cleanest image. High ISO: you can shoot in the dark, but noise creeps in. Set Auto ISO with a ceiling: 6400 for APS-C, 12800 for full-frame.", h: "ISO controls the cleanliness.", p: "Auto ISO with a ceiling and a minimum shutter speed is the safety net — the camera balances the triangle while you compose." },
      { k: "board", board: "visual", vis: "iso-noise", t: "Sensitivity buys you the dark — and sends the bill in grain.", h: "Sensitivity has a price.", cap: "Clean at the bottom, grainy at the top — the curve every low-light shot negotiates." },
      { k: "say", a: "ch3-l2-comp", t: "Your exposure compensation dial bends the brightness without leaving the semi-automatic modes. Want a bright, airy portrait? Dial +0.7 or +1.0. Preserving highlight detail in a sunset? Dial –1.0.", h: "The ± dial.", p: "The live histogram tells the truth: bunched against the right edge, highlights are clipping; against the left, shadows are drowning." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  },
  "ch03-focus": {
    status: "Target Locked",
    answer: "Sharpness isn't luck; it's a choice. If the camera isn't focusing where you want, you haven't given it a specific enough command.",
    scenario: true,
    close: { a: "ch3-l3-close", t: "If your images are still blurry, check your shutter speed. Focus gets the blame, but motion blur is often the real “glitch.”" },
    cards: [
      { k: "say", a: "ch3-l3-intro", t: "Now, let's tackle the feature that often intimidates newcomers more than any other: Focus.", h: "The intimidating one.", p: "Mirrorless focus lives on the sensor itself — the tools are pro-grade, and simpler than they look." },
      { k: "say", a: "ch3-l3-sensor", t: "On a mirrorless camera, autofocus lives right on the imaging sensor. What you see in the viewfinder is exactly what the sensor sees. No calibration guesswork.", h: "What you see is what it sees.", p: "The autofocus system reads the same image you do — that's the mirrorless advantage." },
      { k: "say", a: "ch3-l3-afs", t: "AF-S locks focus once, when you half-press the shutter, and holds it. Landscapes, still life, posed portraits: this is your mode.", h: "AF-S: lock and hold.", p: "Ideal for stationary subjects — the camera locks once and holds until you take the shot." },
      { k: "say", a: "ch3-l3-afc", t: "AF-C never stops adjusting while you hold the button. It tracks movement in real time. Kids, pets, street, wildlife: anything that moves.", h: "AF-C: never lets go.", p: "The go-to for anything that moves — hold the button halfway, or use back-button focus." },
      { k: "say", a: "ch3-l3-afa", t: "AF-A switches between the two on its own. Handy — but choosing deliberately teaches you more, and misses less.", h: "AF-A: the automatic referee.", p: "It guesses based on subject movement. Deliberate choice gives you more control — and a better understanding." },
      { k: "board", board: "list", chip: "Areas", t: "The pattern of focus points the camera uses — from a pinpoint you place to the whole frame it reads.", h: "Tell it where to look.", rows: [
        { k: "Single Point / Flexible Spot", v: "You manually place a small focus point exactly where you want critical sharpness — an eye tack sharp, or macro work.", lit: 1 },
        { k: "Zone / Expanded Flexible Spot", v: "A cluster of points that gives the camera more room to track within a defined area of the frame.", lit: 1 },
        { k: "Wide / Auto Area", v: "The camera uses the entire sensor to identify and lock onto subjects, often prioritizing faces or the closest object.", lit: 1 },
        { k: "Tracking", v: "Place a focus box on a subject, and the camera follows it as it moves across the frame while you recompose.", lit: 1 }
      ] },
      { k: "say", a: "ch3-l3-eye", t: "Eye-Tracking is your “Cheat Code.” Turn it on and let the AI handle the precision while you handle the framing.", h: "The cheat code.", p: "The standard for portraits: the eye stays tack sharp while you handle everything else." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  },
  "ch04-photography-basics": {
    status: "Foundation Set",
    answer: "Photography is the art of capturing light. To master it, you must understand 'Stops'—the universal language of exposure.",
    scenario: true,
    close: { a: "ch4-l1-close", t: "Mastering Manual isn't about memorizing numbers. It's about learning to “see” the trade-off." },
    cards: [
      { k: "say", a: "ch4-l1-intro", t: "To move beyond being a “Jim” (who expects the camera to do the work), you must master the three pillars of a great image: Composition, Framing, and Light.", h: "Three pillars.", p: "Your camera is a high-tech light-trap; these principles are how you bait that trap to catch something beautiful." },
      { k: "board", board: "visual", vis: "camera-anatomy", t: "Lens, sensor, mount, EVF — no mirror. Light hits the sensor directly.", h: "The light-trap, opened up.", cap: "The light-trap, opened up: lens, sensor, mount, EVF. No mirror — light hits the sensor directly." },
      { k: "say", a: "ch4-l1-thirds", t: "Stop placing your subject dead-center! It feels static and “snapshot-y.” Imagine a tic-tac-toe grid over your screen. Place your subject (or their eyes) on one of the four points where the lines intersect.", h: "The Rule of Thirds.", p: "This creates “negative space” and lead-in room, making the image feel balanced and professional. Pro tip: turn on your camera's “Grid Line” setting to see the overlay while you shoot." },
      { k: "board", board: "list", chip: "Framing", t: "Framing is about what you leave out of the shot as much as what you put in.", h: "Framing: tell a story with layers.", rows: [
        { k: "Leading Lines", v: "Look for natural lines (a road, a fence, a shoreline) that point toward your subject. This literally “leads” the viewer's eye through the photo.", lit: 1 },
        { k: "The “Frame-within-a-Frame”", v: "Use an overhanging tree branch, a doorway, or an archway to physically frame your subject. This adds depth and makes a 2D photo feel 3D.", lit: 1 },
        { k: "Watch the “Head-Room”", v: "Don't leave a massive gap above someone's head, but don't “cut off” their joints (ankles, knees, elbows) at the edge of the frame.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l1-light", t: "Pros don't see objects; they see how light hits objects. The Golden Hour: the hour after sunrise and before sunset. The light is “directional” and warm, creating long, soft shadows that flatter skin and landscapes.", h: "See light like a pro.", p: "Front light is easy but flat. Side light is the “Professional Secret” — shadows that reveal texture and shape. Backlight places a “halo” around your subject." },
      { k: "say", a: "ch4-l1-aperture", t: "Aperture is simply the size of the opening in your lens. Think of it like the pupil of your eye. In the dark, your pupil dilates to let in more light — in photography, we call this “shooting wide open.”", h: "The eye analogy.", p: "Small numbers (f/1.8, f/2.8) = huge openings. Large numbers (f/11, f/16) = tiny openings. Think of the number as a fraction: f/2 is much larger than f/16." },
      { k: "board", board: "visual", vis: "aperture-dof", t: "Shallow isolates a single subject. Deep keeps every face in the group clear.", h: "Depth of field: controlling the focus.", cap: "Shallow depth of field: only a tiny slice in focus — that's bokeh. Deep depth of field: everything sharp, from the blade of grass at your feet to the mountain." },
      { k: "say", a: "ch4-l1-bokeh", t: "Bokeh is a formula: use your lowest f-number. Get physically closer to your subject — the closer you are, the blurrier the background becomes. And increase the distance between your subject and the background.", h: "The Three-Foot Rule for maximum bokeh.", p: "If your subject is leaning against a wall, that wall won't blur. Move them 10 feet away from it, and it will disappear into a soft haze." },
      { k: "say", a: "ch4-l1-shutter", t: "Inside your camera is a curtain: the shutter. Fast shutter: the “blink” is instantaneous. Slow shutter: the “blink” is a long stare — anything moving while the shutter is open will appear as a streak of light or a blur.", h: "Freeze or flow.", p: "Start at 1/500 for a walking person, 1/1000 for a running child or athlete, and 1/2000+ for a bird in flight." },
      { k: "board", board: "visual", vis: "shutter-blur", t: "The Golden Rule: slower than 1/60, you cannot hand-hold — even your heartbeat will shake the camera. Use a tripod.", h: "Motion blur: painting with light.", cap: "Try 1/15 or 1/30 to show a bit of motion in a crowd. Go to 1 second or longer for that “milky” water effect." },
      { k: "say", a: "ch4-l1-iso", t: "Think of ISO like the volume knob on a stereo. Low ISO is the “clean” setting — crisp and clear. High ISO is “cranking the volume”: you can hear it in the dark, but the static creeps in. That static is digital noise.", h: "The volume knob.", p: "Set your Aperture and Shutter Speed first. If the image is still too dark, then reach for the ISO dial to bridge the gap." },
      { k: "board", board: "visual", vis: "iso-noise", t: "A “grainy” photo of a once-in-a-lifetime moment beats a “clean” photo that is pitch black.", h: "Light vs. grain.", cap: "Use ISO 100 for landscapes and sunny days. Move to ISO 800-1600 for overcast days or indoors. Save ISO 3200+ for the “impossible” shots in the dark." },
      { k: "say", a: "ch4-l1-seesaw", t: "The 'Exposure Triangle' is a seesaw, not a triangle. Aperture, Shutter Speed, and ISO are locked in a constant three-way tug-of-war for light. If you change one, at least one of the others must change to keep your exposure balanced.", h: "The seesaw, and the fourth pillar.", p: "Your meter: the scale from -3 to +3 in your viewfinder. Needle at 0, you're balanced. At -2, you're 2 “stops” too dark. At +2, 2 stops too bright." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  },
  "ch04-videography-basics": {
    status: "Motion Initialized",
    answer: "Video is just a sequence of photos. The “feeling” of your video is determined by your Frame Rate and Resolution.",
    close: { a: "ch4-l2-close", t: "Resolution is for detail, but Frame Rate is for emotion. Choose wisely based on the story you're telling." },
    cards: [
      { k: "say", a: "ch4-l2-intro", t: "If photography is about catching a “decisive moment,” videography is about capturing the flow of time. To move from “recording a clip” to “creating a film,” you need to master how your camera sees motion.", h: "The flow of time.", p: "Frame Rate (FPS) is the number of individual photos your camera captures every second." },
      { k: "board", board: "list", chip: "Frame Rates", t: "24 is cinema. 30 is TV. 60 and 120 are slow-motion data.", h: "The speed of time.", rows: [
        { k: "24 fps (The Cinema Standard)", v: "This is what Hollywood uses. It has a slight, natural motion blur that our brains associate with “movies.” Best for: narrative storytelling and interviews.", lit: 1 },
        { k: "30 fps (The TV Standard)", v: "A bit crisper and more “real.” Best for: vlogs, YouTube tutorials, and news.", lit: 1 },
        { k: "60 fps or 120 fps (Slow Motion)", v: "Captures massive amounts of data. When you play this back at 24 fps, it becomes smooth, buttery slow motion.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l2-soap", t: "Never use 60 fps for a standard talking-head video; it will look unnaturally “smooth” and digital — the “Soap Opera Effect.”", h: "The Soap Opera Effect.", p: "A pro tip straight from the lesson: high frame rates are for slowing down, not for talking heads." },
      { k: "board", board: "list", chip: "Resolution", t: "Resolution is the number of pixels that make up your image.", h: "Choosing your canvas.", rows: [
        { k: "1080p (Full HD)", v: "The standard for years. Easy on your computer's processor and takes up less space on your SD card.", lit: 1 },
        { k: "4K (Ultra HD)", v: "Four times the detail of 1080p. The secret advantage: shoot in 4K and you can “crop in” during editing without losing quality, even delivering in 1080p.", lit: 1 },
        { k: "8K and Beyond", v: "High-end professional territory. Unless you have a supercomputer and massive hard drives, 4K is your sweet spot.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l2-rule", t: "The 180-Degree Rule is the “Golden Rule” of video that beginners always miss. To get that natural, cinematic motion blur, your Shutter Speed must be double your Frame Rate.", h: "The 180-Degree Rule.", p: "If your shutter is too fast, your video looks “choppy” and “staccato.” If it's too slow, it looks “smeary.”" },
      { k: "board", board: "visual", vis: "fps-shutter", t: "The shutter pairing is the whole rule — one ratio, every frame rate.", h: "Double the frame rate.", cap: "Shooting 24 fps? Set your shutter to 1/50. Shooting 60 fps? Set your shutter to 1/125." },
      { k: "say", a: "ch4-l2-story", t: "Never film an entire scene from one spot. Use the Wide, Medium, Tight workflow: the Wide shows where we are. The Medium shows who is doing what. The Tight shows the emotion or a specific object.", h: "Wide. Medium. Tight.", p: "Motivated movement only: if you move the camera, it should be following something. If the subject is still, the camera usually stays still." },
      { k: "say", a: "ch4-l2-scene1", t: "You want that classic “Movie” look for a YouTube vlog. You've set your Frame Rate to 24fps.", h: "The setup.", p: "First System Check — the 180-Degree Rule decides your shutter." },
      { k: "check", ci: 0 },
      { k: "say", a: "ch4-l2-scene2", t: "You want to shoot a “Slow Motion” clip of a skater.", h: "New setup.", p: "Same lesson, different job: which frame rate earns the slow motion?" },
      { k: "check", ci: 1 }
    ]
  },
  "ch04-audio-basics": {
    status: "Signal Clear",
    answer: "People will forgive “okay” video, but they will click away from “bad” audio instantly.",
    scenario: true,
    close: { a: "ch4-l3-close", t: "Get the mic as close to the subject's mouth as possible. Distance is the enemy of clear sound." },
    cards: [
      { k: "say", a: "ch4-l3-intro", t: "If a viewer sees a blurry video with crystal-clear audio, they'll keep watching. But if they see a 4K masterpiece with distorted, echoing audio, they'll turn it off in seconds.", h: "Audio decides who stays.", p: "Professional sound isn't about expensive gear; it's about proximity and protection." },
      { k: "say", a: "ch4-l3-closer", t: "The single most effective way to improve your audio is to physically move the microphone closer to the subject. Even the best on-camera shotgun microphones lose their professional “edge” once they are more than 3-4 feet away from the speaker.", h: "The Golden Rule: get the mic closer.", p: "The solution: a 3.5mm extension cable or a wireless system like the Rode Wireless GO — the mic within 6-12 inches of the person speaking." },
      { k: "board", board: "list", chip: "Mics", t: "Three kinds of ears — and only one of them is an emergency option.", h: "Know your microphones.", rows: [
        { k: "Built-in Camera Mic", v: "“Omnidirectional” — they catch sound from every direction, including the hum of your lens motor and the wind hitting the camera. Avoid these for dialogue.", lit: 1 },
        { k: "Shotgun Microphones", v: "Highly directional mics that “focus” on whatever they are pointed at while rejecting noise from the sides.", lit: 1 },
        { k: "Lavalier (Lapel) Mics", v: "Small mics that clip onto clothing. The kings of consistency — they stay at the same distance from the mouth even if the person moves.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l3-levels", t: "Never leave your audio record level on “Auto,” or the camera will “hunt” for sound, creating a loud background hiss during silences. You want your loudest speaking moments to “peak” between −12dB and −6dB.", h: "Setting your levels: the −12dB rule.", p: "If the meter hits 0dB, your audio is “clipping” — a digital crackle that is impossible to fix in editing." },
      { k: "board", board: "visual", vis: "audio-meter", t: "−12dB gives you “headroom” — room for a laugh or a shout before the red.", h: "The safe zone.", cap: "Aim for the meters to bounce around −12dB. Anything hitting 0dB is “clipping” and is permanently ruined." },
      { k: "say", a: "ch4-l3-room", t: "Every room has a “sound.” Before you start filming, record 30 seconds of total silence. This is called “Room Tone,” and editors use it to patch over gaps in your audio later. And always monitor with headphones — you cannot trust your eyes to “see” good audio.", h: "Hear it now, not in the edit.", p: "Hard surfaces bounce sound into an “echoey” amateur feel. Throw down a rug or hang thick blankets just out of frame to soften the room." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  },
  "ch04-creative-looks": {
    status: "Instant Aesthetic",
    answer: "Creative Looks (or Film Simulations/Picture Controls) are “baked-in” styles. They are designed for the creator who wants a “finished” look right out of the camera with zero editing required.",
    close: { a: "ch4-l4-close", t: "Creative Looks are for the now. They save you time and help you see your creative vision before you even hit the shutter." },
    cards: [
      { k: "say", a: "ch4-l4-intro", t: "Creative Looks are the shortcut to that professional finish. Think of these as high-end, sophisticated versions of Instagram filters — but instead of being slapped on top of a photo later, they are “baked” into the image data as the light hits the sensor.", h: "Baked in, not slapped on.", p: "They allow you to see the “mood” of your photo through the viewfinder before you even press the shutter." },
      { k: "board", board: "list", chip: "Looks", t: "Five looks, five moods — chosen before the shutter, not after.", h: "The lineup.", rows: [
        { k: "ST (Standard)", v: "The All-Rounder. Balanced color, contrast, and sharpness for a natural look — an accurate representation of exactly what your eyes are seeing.", lit: 1 },
        { k: "VV / VV2 (Vivid)", v: "The Energy Booster. Cranks up the saturation and contrast for punchy, high-impact colors — lush landscapes, bright blue skies, vibrant flowers.", lit: 1 },
        { k: "FL (Film-like)", v: "The Moody Cinematic. A vintage, “filmic” contrast with slightly desaturated tones and moody shadows — the “secret sauce” for street photography.", lit: 1 },
        { k: "IN (Instant/Matte)", v: "The Soft Aesthetic. Lowers contrast and saturation for a matte, “dreamy” texture — soft, airy lifestyle shots.", lit: 1 },
        { k: "BW / SE (Monochrome)", v: "The Timeless Classic. Removes color entirely to focus purely on light, shadow, and texture — dramatic architecture, or Sepia for an old-world vibe.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l4-secret", t: "A “Decoder's” secret — switching to B&W helps you ignore color and focus entirely on lighting, shadows, and composition.", h: "The Decoder's secret.", p: "Don't just stay in Standard. Experiment with “Neutral” if you want to keep colors realistic and under control." },
      { k: "say", a: "ch4-l4-scene1", t: "You're shooting a “Street Photography” session. You want the photos to have a high-contrast, moody vibe without needing to edit them on your computer later.", h: "The setup.", p: "Which look is the shortcut? First System Check." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  },
  "ch04-picture-profiles": {
    status: "High-Dynamic Range Active",
    answer: "Picture Profiles are for the future. They are advanced “data containers” (like S-Log, C-Log, or HLG) designed to capture the maximum amount of light information for professional color grading later.",
    close: { a: "ch4-l5-close", t: "Only use Picture Profiles if you plan to “Color Grade” your footage in software later. Otherwise, you're just making extra work for yourself!" },
    cards: [
      { k: "say", a: "ch4-l5-intro", t: "If “Creative Looks” are like instant filters for your photos, Picture Profiles are the heavy-duty blueprints for your video. They go far deeper than simple color presets, allowing you to manipulate the Gamma Curve — the way your camera handles the transition from the deepest shadows to the brightest highlights.", h: "The heavy-duty blueprints.", p: "Some of these profiles look like a gray, washed-out mess straight out of the camera. That's not a bug; it's a feature." },
      { k: "board", board: "list", chip: "Profiles", t: "Four containers, four levels of commitment — the grade decides which one you earn.", h: "The lineup.", rows: [
        { k: "Standard / Movie (Rec.709)", v: "The “Ready-to-Go” Look. Natural contrast and colors that look “correct” on any screen immediately — fast-turnaround projects, vlogs. Get your White Balance perfect first; there's less room to fix it later.", lit: 1 },
        { k: "S-Cinetone / Cine4", v: "The Professional Shortcut. Mimics the color science of high-end cinema cameras, with soft highlights and beautiful skin tones — a “filmic” look without the complexity of Log.", lit: 1 },
        { k: "Log Profiles (S-Log3, C-Log, V-Log)", v: "The “RAW” of Video. A logarithmic curve that squeezes a massive amount of light data into a flat, gray-looking image, preserving detail in bright skies and dark shadows.", lit: 1 },
        { k: "HLG (Hybrid Log Gamma)", v: "The HDR Specialist. Designed for High Dynamic Range displays — a balance between a “finished” look and extra detail in highlights.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l5-log", t: "Most Log profiles (especially S-Log3) perform best when you slightly “overexpose” the image — often by +1.7 or +2.0 on your light meter — to keep the shadows clean and noise-free.", h: "The exposure secret.", p: "Log holds the most dynamic range of any profile — that's the data your color grade will live on." },
      { k: "board", board: "visual", vis: "gamma-curves", t: "Flat is not broken. Flat is un-decided — on purpose.", h: "Two curves, two philosophies.", cap: "The standard curve decides the look for you. The log curve stays flat and keeps the data, so you decide later." },
      { k: "say", a: "ch4-l5-assist", t: "Turn on Gamma Display Assist in your menu so you can see a “normal” version of the image while the camera records the flat “Log” version.", h: "See normal, record flat.", p: "From the recap: Log is “hiding” the data in the highlights and shadows for later. It looks “bad” now so it can look “pro” later." },
      { k: "say", a: "ch4-l5-scene1", t: "You're recording a video for a client who wants a “Cinematic Movie” look. They tell you they are going to “Color Grade” the footage later.", h: "The setup.", p: "Which profile gives them the most data to grade? First System Check." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  },
  "ch04-lowlight": {
    status: "Night Vision Active",
    answer: "When light is scarce, you have to prioritize “Information” over “Perfection.”",
    scenario: true,
    close: { a: "ch4-l6-close", t: "Digital noise (grain) can be fixed in editing; a blurry, dark mess cannot." },
    cards: [
      { k: "say", a: "ch4-l6-intro", t: "This is where “Jim” usually gives up. When the sun goes down, your camera has to fight for every photon. Here is your professional workflow for clean night shots.", h: "The photon fight.", p: "In low light, your goal is to “open the floodgates.”" },
      { k: "board", board: "list", chip: "The Order", t: "The order matters: glass first, time second, sensitivity last.", h: "Trust the Triangle.", rows: [
        { k: "Aperture", v: "Dial it to the lowest number (e.g., f/1.8).", lit: 1 },
        { k: "Shutter", v: "Slow it down as much as you can without causing blur (try 1/60 for handheld).", lit: 1 },
        { k: "ISO", v: "Crank this last. Don't be afraid of ISO 3200 or 6400. Modern sensors are designed for this!", lit: 1 }
      ] },
      { k: "board", board: "visual", vis: "iso-noise", t: "The same curve from Chapter 3 — now it's the whole lesson.", h: "Texture over failure.", cap: "Higher ISO buys brightness with grain. A sharp grainy shot beats a clean blurry one." },
      { k: "say", a: "ch4-l6-grain", t: "Grain is texture. Blur is failure. Choose texture.", h: "Her rule for the dark.", p: "Her words, from this lesson: in the Decoder mindset, a sharp grainy photo is a “vibe”; a clean blurry photo is a mistake." },
      { k: "say", a: "ch4-l6-keylight", t: "If you are shooting a stationary subject (like a city skyline), use a tripod and a 10-second shutter speed. This allows you to keep your ISO at 100 for a crystal-clear, noise-free image even in pitch black. For people: even in the dark, there is usually a street lamp, a neon sign, or a candle. Position your subject so that the light hits their face at an angle.", h: "Tripod stills, key light for people.", p: "The angled light creates “shape” — and helps your camera's autofocus find a target." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 }
    ]
  }
};
