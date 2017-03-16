function log() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift("LOG");
  console.log.call(console.log, args.join(' '));
}

module.exports = log;
