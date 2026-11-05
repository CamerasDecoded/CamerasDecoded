/* =====================================================================
   FIELD MANUAL — GUIDED DECKS (Manual № 01 Chapters 1–5 · Manual № 02 "The Finish")
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
    status: "Intentional",
    answer: "Exposure was Chapter 3. This chapter is intent: aperture chooses the story, shutter chooses the moment, and ISO serves them both.",
    close: { a: "ch4-l1-close", t: "Before your next shot, name the priority out loud — sharp, frozen, or clean — then set that dial first." },
    cards: [
      { k: "say", a: "ch4-l1-intro", t: "To move beyond being a “Jim” (who expects the camera to do the work), you must master the three pillars of a great image: Composition, Framing, and Light.", h: "Three pillars.", p: "Your camera is a high-tech light-trap; these principles are how you bait that trap to catch something beautiful." },
      { k: "say", a: "ch4-l1-thirds", t: "Stop placing your subject dead-center! It feels static and “snapshot-y.” Imagine a tic-tac-toe grid over your screen. Place your subject (or their eyes) on one of the four points where the lines intersect.", h: "The Rule of Thirds.", p: "This creates “negative space” and lead-in room, making the image feel balanced and professional. Pro tip: turn on your camera's “Grid Line” setting to see the overlay while you shoot." },
      { k: "board", board: "list", chip: "Framing", t: "Framing is about what you leave out of the shot as much as what you put in.", h: "Framing: tell a story with layers.", rows: [
        { k: "Leading Lines", v: "Look for natural lines (a road, a fence, a shoreline) that point toward your subject. This literally “leads” the viewer's eye through the photo.", lit: 1 },
        { k: "The “Frame-within-a-Frame”", v: "Use an overhanging tree branch, a doorway, or an archway to physically frame your subject. This adds depth and makes a 2D photo feel 3D.", lit: 1 },
        { k: "Watch the “Head-Room”", v: "Don't leave a massive gap above someone's head, but don't “cut off” their joints (ankles, knees, elbows) at the edge of the frame.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l1-light", t: "Pros don't see objects; they see how light hits objects. The Golden Hour: the hour after sunrise and before sunset. The light is “directional” and warm, creating long, soft shadows that flatter skin and landscapes.", h: "See light like a pro.", p: "Front light is easy but flat. Side light is the “Professional Secret” — shadows that reveal texture and shape. Backlight places a “halo” around your subject." },
      { k: "say", a: "ch4-l1-field", t: "Chapter 3 built the exposure triangle — aperture, shutter speed, and ISO trading stops of light. This chapter doesn't re-teach it. It puts it to work.", h: "The triangle, in the field.", p: "What follows is the field version: the rules and the numbers you actually run with a camera in your hands." },
      { k: "board", board: "list", chip: "Field Rules", t: "Four rules run the triangle at shooting speed: the reciprocal rule, the 1/60 line, base-ISO discipline, and the meter as your scoreboard.", h: "The rules that keep you sharp.", rows: [
        { k: "The Reciprocal Rule", v: "Your shutter speed should be at least 1 divided by your focal length. Zoomed to 50mm, don't shoot slower than 1/50. At 200mm, you need 1/200 or faster — otherwise your own hands become the blur.", lit: 1 },
        { k: "The 1/60 Rule", v: "Slower than 1/60 handheld, even your heartbeat shakes the frame. Below that line, it's tripod territory.", lit: 1 },
        { k: "Base ISO Discipline", v: "Set aperture and shutter for the shot you want first. If the image is still too dark, raise ISO to bridge the gap — and only as far as the light forces you. Base ISO (usually 100) is where your camera makes its cleanest, most professional image.", lit: 1 },
        { k: "Read the Meter", v: "The −3 to +3 scale in your viewfinder is the triangle's scoreboard. Needle at −2 means two stops too dark: open the aperture, slow the shutter, or raise the ISO until it settles near 0.", lit: 1 }
      ] },
      { k: "say", a: "ch4-l1-runit", t: "In the field you don't re-derive the triangle — you run it. Aperture for the look, shutter for the moment, ISO only as far as you must.", h: "Run it, don't re-derive it.", p: "Freeze numbers worth memorizing: 1/500 — a walking person, frozen. 1/1000 — a running child, an athlete, a pet mid-stride. 1/2000+ — a bird in flight, the fastest thing you will ever chase." },
      { k: "say", a: "ch4-l1-intent", t: "Here's what separates this chapter from Chapter 3: the settings stop being about correct exposure and start being about intent.", h: "Intent, not just exposure.", p: "Every choice from here is a creative decision first and a technical one second." },
      { k: "board", board: "visual", vis: "aperture-dof", t: "Neither is “correct.” They say different things — choose the one your photo means. And bokeh is a formula: lowest f-number, get physically close, and put distance between your subject and the background.", h: "Depth of field: decide what the story is about.", cap: "A low f-number isolates — one face melts clean out of a busy background. A high f-number declares everything in the frame equally important, from the grass at your feet to the mountain behind it." },
      { k: "say", a: "ch4-l1-motion", t: "Freezing is only half the craft. Deliberate blur is the other half: 1/15 or 1/30 streaks a crowd into energy, and a second or longer turns waterfalls to silk and traffic into light trails.", h: "Freeze it or paint with it.", p: "Blur chosen on purpose is a style. Blur by accident is a mistake. The settings can be identical — the intent is the difference." },
      { k: "say", a: "ch4-l1-noise", t: "A grainy photo of a once-in-a-lifetime moment is infinitely better than a clean photo that is pitch black.", h: "Embrace the noise.", p: "Modern mirrorless cameras hold detail at ISO 3200 and 6400 far better than you expect. Don't let fear of grain talk you out of the shot." },
      { k: "say", a: "ch4-l1-oneq", t: "Stop trying to set everything at once. Ask one question: what is the most important creative choice for this shot? Set that control first, and let the other two serve it.", h: "The pro workflow: one question.", p: "Mastering Manual isn't about memorizing numbers. It's about learning to “see” the trade-off: What do I want sharp? What do I want to freeze? How much grain is acceptable?" },
      { k: "say", a: "ch4-l1-scene1", t: "You're shooting a portrait at golden hour. Your subject stands in front of a busy street market, and you want her to melt cleanly away from that background while the light fades around you.", h: "The setup.", p: "First System Check — the bokeh formula decides the blur." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
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
  },
  "fin-ch01-l1": {
    status: "Diagnosed",
    answer: "Diagnose in one sentence before you move a slider.",
    scenario: true,
    close: { a: "fin-ch01-l1-close", t: "When a frame feels 'off' and you cannot name why, that is not a mystery. That is the lesson. Slow down until the sentence arrives." },
    cards: [
      { k: "say", a: "fin-ch01-l1-intro", t: "Every edit begins before the first slider moves. Open a photo and ask three questions, in this order. First: where is the light, and what is it doing? Second: what is the color cast? Every scene leans warm, cool, or green — name the lean before you try to correct it. Third, and most editors skip this one: what is already right?", h: "Look first.", p: "A diagnosis is a map of what to fix AND what to protect." },
      { k: "say", a: "fin-ch01-l1-example", t: "A portrait by a window: the light rakes across her face from camera-left, skin bright and textured on the lit side. The room behind falls dark and cool. What is right: the skin exposure and the light's direction. What needs work: the shadow side of the face sits about a stop under where it wants to be, and the cool cast makes the room feel colder than the moment was.", h: "The worked example.", p: "That paragraph — written before touching anything — is the entire edit, in words. The sliders just execute it." },
      { k: "say", a: "fin-ch01-l1-sentence", t: "Compress the diagnosis into a single sentence: 'The window light is right, her shadow side is a stop under, and the room leans cold.' If you cannot say it in one sentence, you do not have a diagnosis yet — you have a feeling, and feelings produce random slider walks.", h: "One sentence.", p: "The sentence limits the edit — and gives you a finish line: when the sentence stops being true, the edit is done." },
      { k: "board", board: "list", chip: "The Failures", t: "Nearly every photograph suffers from some combination of these five — and each has a known tool.", h: "The short list of what goes wrong.", rows: [
        { k: "Exposure placed wrong", v: "The whole frame lives too bright or too dark.", lit: 1 },
        { k: "Highlights clipped", v: "The brightest areas have gone flat white and lost their texture.", lit: 1 },
        { k: "A cast", v: "The light's color is lying about the scene's color.", lit: 1 },
        { k: "Flat contrast", v: "Everything crowds the middle and nothing separates.", lit: 1 },
        { k: "Skin color off", v: "The one error the human eye forgives last, because we are built to read faces.", lit: 1 }
      ] },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch01-l2": {
    status: "Clean Start",
    answer: "Every slider position should be a decision you can defend out loud.",
    scenario: true,
    close: { a: "fin-ch01-l2-close", t: "A clean start is not a limitation, operator. It is the reason you can afford to be bold. Nothing you do to a copy can harm the truth underneath it." },
    cards: [
      { k: "say", a: "fin-ch01-l2-intro", t: "Every photo you bring into the Develop Lab opens as the untouched original. No look applied, no settings carried over from the last photograph you edited. The original is the truth of what your sensor recorded. If the starting point is contaminated by yesterday's decisions, you are no longer editing this photograph. You are negotiating with a stranger's grade.", h: "Why the Lab opens clean.", p: "Think of the film era: every print started from the negative, not from the last print you happened to like." },
      { k: "say", a: "fin-ch01-l2-defend", t: "In this Lab, nothing applies itself. No slider moves until your hand moves it. Every slider position should be a decision you can defend out loud. If Contrast sits at +40, you should be able to say why. 'It was already there' is not a defense.", h: "Features engage by hand.", p: "Features that engage automatically train operators to accept grades instead of authoring them." },
      { k: "say", a: "fin-ch01-l2-reset", t: "The reset is a tool, not an admission of failure. When a grade feels muddy and you cannot locate why, zero everything and rebuild only what you can defend. Whatever does not earn its way back was never helping.", h: "Reset like a professional.", p: "Professionals reset mid-edit the way pilots cross-check instruments — not because they are lost, but because drift is invisible from inside the drift." },
      { k: "board", board: "list", chip: "The Discipline", t: "Three rules that keep every grade honest.", h: "The discipline.", rows: [
        { k: "Opens Clean", v: "Every photo starts as the untouched original — the reference truth.", lit: 1 },
        { k: "By Hand Only", v: "Nothing applies itself; every position is a decision you can defend out loud.", lit: 1 },
        { k: "Reset = Cross-Check", v: "Zero everything and rebuild only what earns its way back.", lit: 1 }
      ] },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch01-l3": {
    status: "Order Locked",
    answer: "White balance first, structure second, surgery last.",
    scenario: true,
    close: { a: "fin-ch01-l3-close", t: "Reversing the order means arguing with your own first decision. You will win some of those arguments, operator, but you will have all of them, every time, forever." },
    cards: [
      { k: "say", a: "fin-ch01-l3-intro", t: "White balance — Temp and Tint — goes first because temperature defines the palette that every later judgment is made against. Warm that light by 1,500 Kelvin afterward and every relationship you approved was approved under a different sun. Your contrast decision was made in a blue room and now lives in an amber one.", h: "White balance first — always.", p: "The order is not a preference. It is physics and perception stacked in your favor." },
      { k: "board", board: "list", chip: "The Order", t: "Foundations, structure, surgery. Builders do not hang doors before the frame is up.", h: "The order of operations.", rows: [
        { k: "1 · White Balance", v: "Temp and Tint first — they decide what the light IS.", lit: 1 },
        { k: "2 · Exposure + Contrast", v: "The frame's structure — where brightness lives and how hard the tones separate.", lit: 1 },
        { k: "3 · The Color Mixer", v: "Surgery last — per-channel, calibrated against a palette and structure already settled.", lit: 1 }
      ] },
      { k: "say", a: "fin-ch01-l3-cascade", t: "Each stage trusts the one before it. An operator perfects skin in the mixer, then warms the temperature to fix a cold room, and watches the perfected skin slide orange. Nothing broke. The foundation moved, and everything built on it moved too.", h: "What each stage assumes.", p: "A photograph that keeps fighting back is usually a photograph whose foundation moved mid-grade." },
      { k: "say", a: "fin-ch01-l3-revisit", t: "Does the order forbid revisiting? No — it disciplines it. If you must return to Temp late in a grade, you have issued yourself a checklist: re-audit exposure, re-audit the mixer, in that order, because both were calibrated to the old light.", h: "Late changes are allowed.", p: "Professionals make late changes with their eyes open about the cascade. Amateurs chase the damage channel by channel." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch02-l1": {
    status: "Placed With Intent",
    answer: "Place the subject with Exposure. Choose the character with Contrast.",
    scenario: true,
    close: { a: "fin-ch02-l1-close", t: "Place the face, operator. The room can be argued with afterward. The face is the photograph's sworn testimony." },
    cards: [
      { k: "say", a: "fin-ch02-l1-intro", t: "Exposure does not mean 'brightness.' Exposure places the whole frame on the brightness scale — it answers a question: where does this scene live? A candlelit dinner placed bright looks like a waiting room. A noon portrait placed dark looks like a storm warning.", h: "Exposure places the scene.", p: "The correct exposure is the one where the scene's important tones — almost always skin — sit where the moment says they should." },
      { k: "say", a: "fin-ch02-l1-limits", t: "Exposure moves everything together, so it cannot rescue a shadow without also lifting the highlights — push far enough and the brightest areas clip: they go flat white and their texture is gone. When a frame has both a bright window and a dark corner, exposure is the wrong tool for the gap between them.", h: "What exposure cannot do.", p: "That gap belongs to Highlights and Shadows. Exposure's job is placement: set the subject's key tone." },
      { k: "board", board: "visual", vis: "tone-scale", t: "One scale, three territories — and three different tools that govern them.", h: "The tonal scale.", cap: "Exposure places the whole scale. Highlights and Shadows govern its ends. Skin lives in the midtones." },
      { k: "say", a: "fin-ch02-l1-contrast", t: "Contrast drives bright tones brighter and dark tones darker while compressing the midtones between them — and midtones are where skin lives. A little contrast gives a frame separation and spine. Too much gives you waxy faces, crunchy shadows, and a photograph that shouts.", h: "Contrast is a decision.", p: "Calibrate by subject: an honest portrait often wants +15 to +35. Architecture and hard street scenes can carry +40 to +60. A foggy, intimate frame may want contrast reduced." },
      { k: "say", a: "fin-ch02-l1-third", t: "When in doubt, add contrast until you notice it, then take back a third. That last third was your enthusiasm, not the photograph's need.", h: "Take back a third.", p: "The professional question is never 'how much contrast can this take?' It is 'what is this photograph's mood, and how much separation serves it?'" },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch02-l2": {
    status: "Texture Protected",
    answer: "Protect the lit skin first: on window portraits, Highlights go down.",
    scenario: true,
    close: { a: "fin-ch02-l2-close", t: "Glow is light plus texture. Glare is light with the texture removed. The Highlights slider decides which one your subject is wearing." },
    cards: [
      { k: "say", a: "fin-ch02-l2-intro", t: "Here is the counterintuitive law of window light: on a portrait lit by a window, Highlights go DOWN. Raised, it pushes that lit skin toward flat white, and texture dies first. Lower it instead — −20 to −40 is a working portrait range — and the light keeps its shape.", h: "Highlights down on window light.", p: "The skin stays luminous AND detailed, which is the entire promise of window light in the first place." },
      { k: "say", a: "fin-ch02-l2-failure", t: "A concrete failure, from a real grading session: an editor raised Highlights to +72 chasing brightness. The lit side of the face went chalky; the window's soft wrap turned harsh. The repair was not more sliders — it was the same slider, reversed: Highlights −30, and the texture walked back into the frame like it had never left.", h: "The +72 lesson.", p: "Brightness problems in a portrait are rarely highlight problems. When the top of the scale hurts, you pull it down, not push it up." },
      { k: "board", board: "visual", vis: "tone-scale", t: "This lesson lives at the two ends of the scale.", h: "The ends of the scale.", cap: "Highlights govern the top of the scale — where window light lands on skin. Shadows govern the bottom." },
      { k: "say", a: "fin-ch02-l2-shadows", t: "Shadows lifts the bottom of the scale, opening detail in the dark areas. Its gift is readability. Its tax is mud. Push Shadows too far and blacks turn milky gray, the frame fogs, and the fog makes you reach for Contrast — now two sliders are fighting, and the frame gets squeezed from both directions.", h: "Shadows: detail, not fog.", p: "Sequence dissolves the fight. Set Contrast first, as a character decision. Then Shadows for one job only: detail — often +30 to +45 on a window portrait — and stop the moment detail arrives." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch02-l3": {
    status: "Audit Honest",
    answer: "Better is a verdict the before/after delivers — not a feeling your effort delivers.",
    scenario: true,
    close: { a: "fin-ch02-l3-close", t: "The bravest sentence in editing is 'the photograph did not need me.' You will not say it often. But the willingness to say it is what makes your other grades trustworthy." },
    cards: [
      { k: "say", a: "fin-ch02-l3-intro", t: "The before/after comparison slider is not a nostalgia feature. It is an audit instrument. Its job is to answer one question with evidence: is the after actually better — or just more? Those are different verdicts, and new editors confuse them constantly because effort feels like improvement.", h: "The comparison is an audit.", p: "You spent twelve minutes on this grade; of course it looks better to you. The audit exists to overrule that bias." },
      { k: "say", a: "fin-ch02-l3-tensec", t: "Use the ten-second rule. Flip to the full before, look for a slow count of ten, then to the full after. If the after does not win clearly — within those ten seconds, without you arguing its case — the grade is not finished or not honest.", h: "The ten-second rule.", p: "Drag the divider slowly across the frame and interrogate regions, not the whole: what did the face gain? What did the window lose?" },
      { k: "board", board: "visual", vis: "before-after", t: "The audit instrument, in one picture.", h: "The divider.", cap: "The divider is an interrogation tool: face, window, corners — region by region." },
      { k: "say", a: "fin-ch02-l3-drunk", t: "Respect the physiology: editors go blind. After twenty minutes of staring at a grade, your eyes adapt to it — its warmth becomes your neutral, its contrast becomes your normal. Professionals call the failure 'edit-drunkenness.' Flip to the before often. Look away from the screen entirely for thirty seconds. And treat the thumbnail test as law.", h: "Edit-drunkenness is real.", p: "If the subject does not read instantly at postage-stamp size, no amount of zoomed-in slider virtue will save it." },
      { k: "say", a: "fin-ch02-l3-ship", t: "There is a harder verdict the audit sometimes delivers: the original was better. Not better as a starting point — better, full stop. Shipping the near-original is not failure. It is the diagnosis working exactly as designed: you protected what was right, and what was right turned out to be nearly everything.", h: "When the original wins.", p: "Restraint at the audit stage is the difference between an editor and a filter with a subscription." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch03-l1": {
    status: "Light Declared",
    answer: "Temperature declares the light. Tint keeps the witnesses — skin and whites — honest.",
    scenario: true,
    close: { a: "fin-ch03-l1-close", t: "Every photograph testifies about its light. Temperature is where you decide whether that testimony is a report — or an argument." },
    cards: [
      { k: "say", a: "fin-ch03-l1-intro", t: "Temperature is measured in Kelvin, and the number describes the color of light itself. Candlelight burns near 1,900K and glows orange. A tungsten bulb sits near 3,200K. Neutral daylight is about 5,500K. Shade and overcast skies run 6,500K and beyond, leaning blue.", h: "Kelvin: declaring the light.", p: "You are not painting the photo warm or cool. You are declaring what light the photograph was taken in." },
      { k: "board", board: "visual", vis: "kelvin-scale", t: "The scale the Temp slider carries — from candlelight to shade.", h: "The Kelvin scale.", cap: "Higher Kelvin on the slider, warmer photograph — the scale every grade declares from." },
      { k: "say", a: "fin-ch03-l1-decision", t: "Set temperature to match the light that was truly there and colors become honest. Set it deliberately off-honest and you are making an argument: warmer than real says evening, intimacy, nostalgia; cooler than real says morning, distance, rain, steel. Both are legitimate. What is not legitimate is a number chosen by drift.", h: "A decision, not a correction.", p: "Audit yours against the scene: does this frame's light match the light that was in the room?" },
      { k: "say", a: "fin-ch03-l1-tint", t: "Tint is the green-magenta axis, and it lives a quieter life. Fluorescent and cheap LED light leans green, and skin under it goes seasick. Tint moves are small by nature — plus or minus 5 to 15 is a working range, and a tint move you can see at a glance is usually too much.", h: "Tint: the quiet axis.", p: "Judge it on skin and on whites: when a white shirt stops looking green OR pink, you are home." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch03-l2": {
    status: "Skin Protected",
    answer: "Faces in the frame: Vibrance leads, Saturation whispers.",
    scenario: true,
    close: { a: "fin-ch03-l2-close", t: "If faces live in the frame, your hand belongs on Vibrance. Saturation does not know what a face is. Vibrance was built by people who do." },
    cards: [
      { k: "say", a: "fin-ch03-l2-intro", t: "Saturation is the bluntest instrument in the Lab. It raises the intensity of every color in the frame by the same proportion — the red dress, the blue sky, and the skin of every face, all louder together. Push global saturation on a portrait and the first casualty is believable skin, sliding toward sunburn.", h: "Saturation: the blunt instrument.", p: "When people say a photograph 'looks edited,' unchecked saturation is the most common reason why." },
      { k: "say", a: "fin-ch03-l2-vibrance", t: "Vibrance is the intelligent sibling. It reads the frame first: it raises the muted, quiet colors strongly and touches the already-saturated colors gently — and it specifically protects skin tones, the colors your viewers judge most harshly. Vibrance wakes up a dull scene while leaving faces close to honest.", h: "Vibrance: the intelligent sibling.", p: "Saturation says 'everything louder.' Vibrance says 'whatever is whispering, speak up — the faces are fine.'" },
      { k: "board", board: "list", chip: "Two Philosophies", t: "Two sliders, two philosophies — the Lab's layout is a philosophy, read aloud.", h: "Two sliders, two philosophies.", rows: [
        { k: "Saturation", v: "Raises every color by the same proportion — skin included. First casualty on a portrait: believable skin.", lit: 1 },
        { k: "Vibrance", v: "Lifts the muted colors, touches the loud ones gently, and protects skin tones by design.", lit: 1 }
      ] },
      { k: "say", a: "fin-ch03-l2-honest", t: "Saturation still has honest work. A frame with no skin in it — a product shot, a plate of food — can take saturation's equal treatment and shine. But adopt the working order: on any frame containing people, Vibrance first, typically +10 to +25. Only then ask whether saturation adds anything, and answer in single digits.", h: "When saturation is the honest tool.", p: "The sin is not the slider. The sin is reaching for it first, at portrait scale, at plus 30, and then wondering why the bride looks boiled." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch03-l3": {
    status: "Surgery Disciplined",
    answer: "Skin lives in Orange. Hue moves in single digits — and never stacked on extreme temperature.",
    scenario: true,
    close: { a: "fin-ch03-l3-close", t: "Remember the shape of this failure, because you will meet it again wearing your own face: nothing broke, nothing malfunctioned. Three enthusiasms simply agreed with each other too loudly." },
    cards: [
      { k: "say", a: "fin-ch03-l3-intro", t: "The Color Mixer divides the frame's color into eight channels: Red, Orange, Yellow, Green, Aqua, Blue, Purple, and Magenta. Each channel carries two controls. Hue rotates that color family toward its neighbors on the wheel. Saturation raises or drains that family's intensity alone.", h: "Eight channels.", p: "This is surgery after the global grade's general medicine: one family, one intention, small numbers." },
      { k: "board", board: "visual", vis: "mixer-channels", t: "Eight channels — and one of them is carrying every face in your frame.", h: "The mixer.", cap: "Skin lives overwhelmingly in Orange, with Red in support. Every Orange move is a move on every face." },
      { k: "say", a: "fin-ch03-l3-skin", t: "Human skin lives overwhelmingly in the Orange channel, with a supporting share in Red. Every mixer move on Orange is a move on every face in the frame — its saturation is their sun, its hue is their blood. Orange saturation up a few points can wake tired skin. Orange hue swung hard can make a healthy person look like a traffic cone.", h: "Skin lives in Orange.", p: "When you open the Mixer on a portrait, you are holding the skin channel in your hand. Handle it like it is connected to a person, because it is." },
      { k: "say", a: "fin-ch03-l3-lips", t: "Study a real failure. Temperature was pushed to 10,050 Kelvin — an extreme costume of warmth. The Red channel's hue was shifted. Then the Orange channel's hue was shifted the same direction. The subject's red lipstick arrived at orange. The skin tanned into a color no human wears.", h: "The day the lips went orange.", p: "Three moves, each defensible in a whisper, shouted in combination." },
      { k: "say", a: "fin-ch03-l3-discipline", t: "Hue is the strongest control in the entire Lab; treat its working range as plus or minus 5 to 8 on anything connected to a person. Never stack an extreme temperature on top of hue surgery — each amplifies the other's lies. And when color goes wrong, unwind in reverse order of application: the last move made is the first suspect.", h: "Hue with a short leash.", p: "The portrait was rescued by removing two hue shifts and bringing temperature back to an honest evening. The photograph had been fine. The enthusiasm was the error." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch04-l1": {
    status: "Recipe Read",
    answer: "A Look proposes. Your diagnosis disposes.",
    scenario: true,
    close: { a: "fin-ch04-l1-close", t: "A recipe is not a chef, operator. It is a chef's notebook, left open. What you cook with it remains your responsibility — and your credit." },
    cards: [
      { k: "say", a: "fin-ch04-l1-intro", t: "Strip the romance away and a Look is a humble thing: a saved recipe. It is a bundle of slider decisions recorded once and applied to a photograph all at once. Nothing in a Look knows anything about your photograph. The same recipe will be poured over a bride and a parking garage with identical confidence.", h: "A saved recipe, nothing more.", p: "The question is never 'is this a good Look?' It is 'is this recipe's judgment right for THIS frame, at THIS strength, after MY fundamentals have had their say?'" },
      { k: "board", board: "list", chip: "The Shelf", t: "Five packaged judgments about light, color, and mood — beside Original, which is no recipe at all.", h: "The shelf.", rows: [
        { k: "Film 35", v: "One of the Lab's five saved recipes.", lit: 1 },
        { k: "Direct Flash", v: "One of the Lab's five saved recipes.", lit: 1 },
        { k: "Golden Hour", v: "One of the Lab's five saved recipes.", lit: 1 },
        { k: "Halation", v: "One of the Lab's five saved recipes.", lit: 1 },
        { k: "Noir", v: "One of the Lab's five saved recipes.", lit: 1 },
        { k: "Original", v: "No recipe at all — the frame, unopinionated.", lit: 1 }
      ] },
      { k: "say", a: "fin-ch04-l1-costume", t: "A Look is a starting point wearing the costume of a finish. Because it arrives complete, it tempts you to skip the diagnosis, skip the foundation, and call the photograph done. Resist the costume. Read the frame, set the foundation and structure yourself, and let the Look enter as a strong opinion you are auditioning — not a verdict you are obeying.", h: "The costume of a finish.", p: "Operators who grade this way use Looks as accelerant. Operators who start with Looks use them as autopilot — and their portfolios quietly converge on somebody else's taste." },
      { k: "say", a: "fin-ch04-l1-ritual", t: "Apply a Look the professional way. First, the audition: look at the whole frame before touching anything. Second, the interrogation: read what the recipe actually DID — with your eyes, because a Look renders on top of your sliders and never moves them; the panels will not confess it. Third, the correction pass: your globals serve this photograph against the recipe's generality.", h: "Audition, interrogate, correct.", p: "You cannot manage a collaborator whose moves you have not read." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch04-l2": {
    status: "Taste Calibrated",
    answer: "Validate on flat. Set intensity by the photograph's need, then pull back ten and listen.",
    scenario: true,
    close: { a: "fin-ch04-l2-close", t: "Intensity is where taste lives, operator. Two editors can share a recipe and share nothing else — the number they stop at is the signature of their restraint." },
    cards: [
      { k: "say", a: "fin-ch04-l2-intro", t: "The Intensity slider is the most honest control in the Develop Lab, because it admits what the other sliders pretend not to know: strength is a choice. At 70, you are taking seventy percent of the recipe's decisions and keeping thirty percent of the frame's own character. At 100, the recipe finishes your photograph for you, in its author's voice.", h: "The honest slider.", p: "New editors default to 100 because the effect is most visible there. Professionals treat 100 the way chefs treat the whole jar of chili: occasionally correct, usually a confession that nobody was tasting." },
      { k: "board", board: "visual", vis: "intensity-scale", t: "Most honest work lives in the middle of this slider.", h: "The geography of intensity.", cap: "The geography of the slider: seasoning below 40, honest work from 40 to 80, the costume at 100." },
      { k: "say", a: "fin-ch04-l2-flat", t: "Never judge a recipe on an already-graded photograph. A graded photo has already spent its contrast, warmed its light, arranged its colors. Pour a Look over it and you are measuring the recipe on top of somebody's finished decisions — and you may stack two full grades and blame the Look for the collision. Validate every Look on a FLAT frame: untouched, ungraded, honest.", h: "Validate on flat, never on graded.", p: "The flat frame is the only laboratory where a recipe's true strength shows." },
      { k: "say", a: "fin-ch04-l2-pullback", t: "The calibration ritual: set the intensity where it pleases you, then pull it back ten points and flip the before/after. If the photograph does not miss those ten points, they were yours, not its. Keep the pullback.", h: "The pullback ritual.", p: "Your taste will quietly migrate toward the photograph's needs and away from your reflexes. That migration IS the development of taste." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch04-l3": {
    status: "Signature Owned",
    answer: "Your signature is a pattern of judgments — including the judgment to use nothing.",
    scenario: true,
    close: { a: "fin-ch04-l3-close", t: "The empty chair at the table is also a decision. When a frame needs no recipe, operator, your silence in the panels speaks as fluently as your loudest grade." },
    cards: [
      { k: "say", a: "fin-ch04-l3-intro", t: "A signature look is not a slider position. It is the pattern across your decisions that survives changing subjects: your temperature leans warm-of-honest; your contrast builds structure but bows to skin; your colors favor one family and quiet another.", h: "Building your signature.", p: "Clients do not hire a recipe; they recognize a pattern — across a wedding, a storefront, and a portrait — and they call it your style." },
      { k: "say", a: "fin-ch04-l3-codify", t: "Take your three best manual grades — made by hand, through this manual's full order — and read them side by side. The moves they share are your signature trying to introduce itself. Now codify it: write the pattern as a working recipe in plain language, and apply it as your STARTING point on new work — not your finish.", h: "Codify it.", p: "The preset user applies a Look to avoid deciding. The signature owner applies their own distilled decisions to decide FASTER, from a position they authored." },
      { k: "board", board: "list", chip: "The Signature", t: "A signature, written as a working recipe in plain language.", h: "The recipe card.", rows: [
        { k: "Foundation Posture", v: "Your temperature lean — warm-of-honest, honest, or cool — declared the same way every time.", lit: 1 },
        { k: "Contrast Posture", v: "Structure that builds — and bows to skin.", lit: 1 },
        { k: "Color Direction", v: "The family you favor, and the one you quiet.", lit: 1 },
        { k: "Intensity Ceiling", v: "The strength your work does not cross without a reason.", lit: 1 }
      ] },
      { k: "say", a: "fin-ch04-l3-none", t: "The final skill in this chapter is refusal. Documentary and evidentiary work — journalism, real-estate honesty, anything whose value is its truth-claim — takes fundamentals only; a recipe's character is an editorial comment the frame did not consent to. And some frames carry their own color story so completely that a Look would be a second author fighting the first.", h: "When the answer is none.", p: "A portfolio where some photographs are loudly styled and others are simply, perfectly honest does not read as inconsistency. It reads as judgment." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch05-l1": {
    status: "Audit Passed",
    answer: "Zoom in to catch the sins. Zoom out to catch the futility. Ship when the loss column is empty.",
    scenario: true,
    close: { a: "fin-ch05-l1-close", t: "The audit is not where photographs become perfect. It is where you stop being surprised by them. Nothing leaves this room unexamined." },
    cards: [
      { k: "say", a: "fin-ch05-l1-intro", t: "Every photograph in this manual was graded at arm's length, in miniature, the way your phone shows it. The audit happens at 100 percent zoom, where the truth lives. Three sweeps, in order: the skin, the edges, the light.", h: "The audit at one hundred percent.", p: "A finished frame survives both magnifications without an advocate." },
      { k: "board", board: "list", chip: "Three Sweeps", t: "Zoom in to catch the sins — sweep in this order, every time.", h: "The three sweeps.", rows: [
        { k: "The Skin Sweep", v: "Faces at full size: pores present but not craters, color even, no orange residue, no plastic smoothness.", lit: 1 },
        { k: "The Edges Sweep", v: "Walk the borders and corners, where bright distractions and loud corners pull the eye out of the photograph.", lit: 1 },
        { k: "The Light Sweep", v: "The brightest area still has texture, the darkest still has detail, and the light's direction still makes sense.", lit: 1 }
      ] },
      { k: "say", a: "fin-ch05-l1-thumbnail", t: "The audit also has a size dimension, and it cuts the other way. Shrink the frame back to thumbnail — the size at which the world will actually meet it in a feed. Does the subject read instantly? A grade can be impeccable at 100 percent and dead at forty pixels, because the viewer it was made for never zooms.", h: "The thumbnail test.", p: "The audit at full size catches sins. The thumbnail test catches pointlessness. Pass both, or the frame is not finished." },
      { k: "say", a: "fin-ch05-l1-ship", t: "Bring the before/after back for its final duty — the ship-or-hold audit. Is every diagnosed problem solved or consciously accepted? Is anything worse than the original? A frame ships when you can no longer find anything your edit made worse — when the ledger of gains and losses has an empty loss column.", h: "Ship, or hold the frame.", p: "Not when it is perfect — perfection is not on offer. When the loss column is empty." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch05-l2": {
    status: "Shipped Right",
    answer: "Decide the destination before the export. The grade is the asset; every file is drawn from it, fresh.",
    scenario: true,
    close: { a: "fin-ch05-l2-close", t: "The grade is the asset, operator. The exports are its emissaries — each dressed for the country it is visiting, each sent from the same throne." },
    cards: [
      { k: "say", a: "fin-ch05-l2-intro", t: "A photograph is finished. It is not yet shipped — because 'the file' is not one thing. A social feed wants the size preset built for it, judged at forty pixels tall. Print wants the opposite covenant: the largest honest file you have, every pixel of quality preserved, because paper shows everything a screen forgives.", h: "One grade, three destinations.", p: "Exporting is not a formality after the real work. Exporting IS a decision in the real work." },
      { k: "say", a: "fin-ch05-l2-disciplines", t: "Two disciplines govern all of it. First: always export from the audited final grade — never from a near-final variant, because 'final_v3' chaos is how the wrong frame reaches a client's wall. Second: never export an export. JPEG is a lossy format; re-exporting one spends quality you cannot recover, like a photocopy of a photocopy.", h: "Two disciplines.", p: "The Lab keeps your grade; the files it makes are disposable. Treat them that way." },
      { k: "board", board: "list", chip: "Destinations", t: "Decide the destination BEFORE the export, not after the complaint.", h: "The destinations.", rows: [
        { k: "The Feed", v: "The Instagram preset — sized for the feed, quick to load, judged at forty pixels tall.", lit: 1 },
        { k: "Client Preview", v: "Full quality with the watermark on — protected while payment is pending.", lit: 1 },
        { k: "Paid Delivery", v: "The largest file, delivered clean — a watermark on a purchased product is graffiti.", lit: 1 },
        { k: "Print", v: "The largest honest file you have — paper forgives nothing a screen would hide.", lit: 1 }
      ] },
      { k: "say", a: "fin-ch05-l2-watermark", t: "The watermark asks a business question wearing a design costume: who is this file for, and what do I fear? On a public preview, a watermark protects the work from walking away unpaid. On a final, paid client delivery, the same watermark becomes an insult printed across a purchased product; deliver clean.", h: "The watermark decision.", p: "There is no universal answer. There is a universal sin: never thinking about it, and shipping the default." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  },
  "fin-ch05-l3": {
    status: "Finish Signed",
    answer: "Ship the frame you would sign — in a set that signs its name the same way, thirty times.",
    scenario: true,
    close: { a: "fin-ch05-l3-close", t: "You came to this manual owning a camera. You leave it owning a finish. Guard the originals, operator — and sign only what survives your audit." },
    cards: [
      { k: "say", a: "fin-ch05-l3-intro", t: "The Deliver gallery is the artifact by which a client judges whether you are a person with a camera or a professional. They see a set of finished frames, and the set's most powerful quality is consistency — every photograph finished in the same posture: same temperature family, same contrast character, same honesty about skin.", h: "The gallery is the artifact.", p: "A set that coheres reads as authorship. A set where every frame wears a different finish reads as a folder." },
      { k: "say", a: "fin-ch05-l3-promise", t: "Consistency is also a kindness to your future clients: it makes your portfolio a promise you can actually keep. When a client books the warm, honest finish they saw in your gallery, your grade-by-grade discipline is what lets you deliver that exact promise under different light, in a different room, on a tired Friday.", h: "A promise you can keep.", p: "Diagnose, found, structure, color, taste, audit, export — the finishing system is not ceremony. It is how a promise becomes repeatable." },
      { k: "say", a: "fin-ch05-l3-wheel", t: "Close the loop this manual opened with. In the Arena and in front of clients, that skill gets proved. And the delivered work teaches you back: the client who zooms will show you an audit you skipped; the frame that shipped too warm will recalibrate your eye for temperature. Learn, prove, earn, learn again — the wheel this entire platform is built on.", h: "The wheel turns.", p: "The rules were never the skill — the judgment that wields and occasionally overrules them is the skill, and it is now demonstrably yours." },
      { k: "check", ci: 0 },
      { k: "check", ci: 1 },
      { k: "check", ci: 2 }
    ]
  }
};
