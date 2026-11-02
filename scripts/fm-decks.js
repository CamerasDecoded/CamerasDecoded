/* =====================================================================
   FIELD MANUAL — GUIDED DECKS (Chapter 1, Manual № 01)
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
  }
};
