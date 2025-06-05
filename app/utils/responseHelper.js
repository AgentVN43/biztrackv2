// utils/responseHelper.js
exports.handleResult = (res, next, messageIfNotFound = "Not found") => {
  return (err, result) => {
    if (err) return next(err);
    if (!result || (Array.isArray(result) && result.length === 0))
      return res.status(404).json({ success: false, message: messageIfNotFound });
    res.json({ success: true, data: result });
  };
};
