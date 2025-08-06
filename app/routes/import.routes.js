const express = require('express');
const router = express.Router();
const ImportController = require('../controllers/importController');

// Get supported entity types
router.get('/entity-types', ImportController.getEntityTypes);

// Get entity config
router.get('/:entityType/config', ImportController.getEntityConfig);

// Download template for entity type
router.get('/:entityType/template', ImportController.downloadTemplate);

// Import data for entity type
router.post('/:entityType', ImportController.importFromText);

module.exports = router; 