const getNow = (req) => {
  // Deterministic time for automated tests
  if (process.env.TEST_MODE === "1" && req.headers["x-test-now-ms"]) {
    return new Date(Number(req.headers["x-test-now-ms"]));
  }

  // Normal runtime
  return new Date();
};

module.exports = getNow;
