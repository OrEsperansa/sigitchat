class NameAssigner {
  constructor(config) {
    this.names = config.names;
    this.ipOverrides = config.ipOverrides;
    this.ipToName = new Map();
    this.nextNameIndex = 0;
  }

  getNameForIp(ip) {
    if (this.ipOverrides[ip]) {
      return this.ipOverrides[ip];
    }

    if (this.ipToName.has(ip)) {
      return this.ipToName.get(ip);
    }

    const baseName = this.names[this.nextNameIndex % this.names.length];
    const cycle = Math.floor(this.nextNameIndex / this.names.length) + 1;
    const assignedName = cycle === 1 ? baseName : `${baseName}-${cycle}`;

    this.nextNameIndex += 1;
    this.ipToName.set(ip, assignedName);

    return assignedName;
  }
}

module.exports = {
  NameAssigner
};
