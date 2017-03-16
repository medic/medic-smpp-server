function log(...args) {
  args.unshift("LOG");
  console.log.call(console.log, args.join(' '));
}

module.exports = log;
