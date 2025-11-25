// Default positioning settings
export const tutorialDefaults = {
  popupWidth: 300,
  popupWidthMobile: 280,
  popupHeight: 180,
  margin: 0,
  mobileBreakpoint: 768
};

export const tutorialSteps = [
  {
    targetId: 'tutorial-dimensions-panel',
    title: 'Dimensions',
    content: 'Input your cargo dimensions here. You can toggle between cm and inches.',
    desktop: {
      position: 'left',
      arrowPosition: '50%'
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
      arrowPosition: '50%'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  },
  {
    targetId: 'tutorial-toggles-panel',
    title: 'Visualization Options',
    content: 'Toggle visual aids like board type coloring and automatic camera movement.',
    desktop: {
      position: 'left',
      arrowPosition: '50%'
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
      arrowPosition: '50%'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  },
  {
    targetId: 'tutorial-slider-bar',
    title: 'Progress Slider',
    content: 'Drag this slider to manually scrub through the assembly animation.',
    desktop: {
      position: 'top',
      arrowPosition: '50%'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  },
  {
    targetId: 'tutorial-video-controls',
    title: 'Playback Controls',
    content: 'Use these buttons to play, pause, change speed, or jump between assembly steps.',
    desktop: {
      position: 'top',
      arrowPosition: '20%'
    },
    mobile: {
      position: 'top',
      centerOnScreen: true,
      arrowPosition: 'auto'
    }
  }
];
