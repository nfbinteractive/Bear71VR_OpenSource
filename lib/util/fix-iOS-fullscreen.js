module.exports = function () {
  // ensure we are at top on iPhone in landscape
  if (/(iPhone|iPad|iPod)/i.test(navigator.userAgent)) {
    const fixScroll = () => {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 500);
    };

    fixScroll();
    window.addEventListener('orientationchange', () => {
      fixScroll();
    }, false);
  }
};
