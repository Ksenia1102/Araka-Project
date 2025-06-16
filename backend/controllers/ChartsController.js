const ChartsService = require('../services/ChartsService');

const getFilterData = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await ChartsService.getFilterData(userId);
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении фильтров:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getChartStats = async (req, res) => {
  try {
    const { surveyId, classIds } = req.body;
    const userId = req.user.id;
    const stats = await ChartsService.getChartStats(userId, surveyId, classIds);
    res.json(stats);
  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};


module.exports = {
  getFilterData,
  getChartStats
};
