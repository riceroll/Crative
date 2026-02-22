// Default positioning settings
export const tutorialDefaults = {
  popupWidth: 300,
  popupWidthMobile: 280,
  popupHeight: 180,
  margin: 15,
  mobileBreakpoint: 768
};

export const tutorialSteps = [
  {
    targetId: 'tutorial-dimensions-panel',
    title: 'Dimensions',
    content: 'Input your cargo dimensions here. You can toggle between cm and inches.',
    desktop: {
      position: 'left',
      arrowPosition: 'auto'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto' // 'auto' = calculate based on target position
    }
  },
  {
    targetId: 'tutorial-candidates-panel',
    title: 'Candidate Designs',
    content: 'View and select from different crate design options generated for your dimensions.',
    desktop: {
      position: 'left',
      arrowPosition: 'auto'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  },
  {
    targetId: 'tutorial-components-panel',
    title: 'Parts List & Print',
    content: 'View all required parts with quantities and costs. Click the printer icon to print or save as PDF.',
    desktop: {
      position: 'left',
      arrowPosition: 'auto'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  },
  {
    targetId: 'tutorial-slider-bar',
    title: 'Assembly Slider',
    content: 'Drag this slider to manually scrub through the assembly animation. Click Disassemble or Assemble on either side to auto-play.',
    desktop: {
      position: 'top',
      arrowPosition: 'auto'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  },
  {
    targetId: 'tutorial-toggles-panel',
    title: 'Options & Player Mode',
    content: 'Toggle board type colors, auto camera, and switch to Advanced Player for full playback controls with speed and step navigation.',
    desktop: {
      position: 'left',
      arrowPosition: 'auto'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  }
];
