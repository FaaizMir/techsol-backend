exports.getProfile = (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
};

exports.checkAuth = (req, res) => {
  res.json({ valid: true, user: req.user });
};