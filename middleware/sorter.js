
exports.compareDateDescending = function compareDateDescending(a, b) {
    if (a.registerDate < b.registerDate) return 1;
    if (a.registerDate > b.registerDate) return -1;
    return 0;
}