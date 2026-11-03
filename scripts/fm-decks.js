/* =====================================================================
   FIELD MANUAL — GUIDED DECKS (Chapters 1–2, Manual № 01)
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
  }
};
