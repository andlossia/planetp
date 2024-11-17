const verifyVideoAccess = require('../../../utils/verifyAccess'); 

const readItem = (Model, modelName) => async (req, res) => {
  try {
    const item = await Model.findById(req.params._id);

    if (modelName.toLowerCase() === 'video') {
      const accessGranted = await verifyVideoAccess(req.user, item);
      if (!accessGranted) {
        return res.status(403).json({ message: 'Access denied to this video' });
      }
    }

    if (!item) {
      return res.status(404).json({ message: `${modelName} not found` });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      message: `Error fetching ${modelName}`,
      error: error.message,
    });
  }
};

const readItemBySlug = (Model, modelName) => async (req, res) => {
  try {
    const item = await Model.findOne({ slug: req.params.slug });

    if (modelName.toLowerCase() === 'video') {
      const accessGranted = await verifyVideoAccess(req.user, item);
      if (!accessGranted) {
        return res.status(403).json({ message: 'Access denied to this video' });
      }
    }

    if (!item) {
      return res.status(404).json({ message: `${modelName} not found` });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      message: `Error fetching ${modelName}`,
      error: error.message,
    });
  }
};

const readItemByField = (Model, modelName, allowedKeys = []) => async (req, res) => {
  const { key, value } = req.params;

  if (allowedKeys.length > 0 && !allowedKeys.includes(key)) {
    return res.status(400).json({
      message: `Invalid field '${key}'. Allowed fields: ${allowedKeys.join(', ')}`,
    });
  }

  try {
    const item = await Model.findOne({ [key]: value });

    if (modelName.toLowerCase() === 'video') {
      const accessGranted = await verifyVideoAccess(req.user, item);
      if (!accessGranted) {
        return res.status(403).json({ message: 'Access denied to this video' });
      }
    }

    if (!item) {
      return res.status(404).json({ message: `${modelName} not found` });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      message: `Error fetching ${modelName}`,
      error: error.message,
    });
  }
};

module.exports = {
  readItem,
  readItemBySlug,
  readItemByField,
};
