import '@testing-library/jest-dom';

// jsdom has no layout engine, so it ships no scrollIntoView. Components that
// keep a highlighted row in view call it during normal rendering.
Element.prototype.scrollIntoView = () => {};
