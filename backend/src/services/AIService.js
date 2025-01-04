const axios = require('axios');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

class AIService {
  static async analyzeProductivity(timeEntries, tasks) {
    try {
      // Analyze work patterns
      const patterns = this.analyzeWorkPatterns(timeEntries);
      
      // Analyze task completion rates
      const taskMetrics = this.analyzeTaskCompletion(tasks);
      
      // Generate productivity insights
      const insights = this.generateInsights(patterns, taskMetrics);
      
      return {
        patterns,
        taskMetrics,
        insights,
        recommendations: this.generateRecommendations(insights)
      };
    } catch (error) {
      console.error('Error in productivity analysis:', error);
      throw error;
    }
  }

  static analyzeWorkPatterns(timeEntries) {
    const patterns = {
      mostProductiveHours: [],
      averageWorkDuration: 0,
      breakPatterns: [],
      taskCategories: {}
    };

    // Analyze time entries
    timeEntries.forEach(entry => {
      // Calculate most productive hours
      const hour = new Date(entry.startTime).getHours();
      if (!patterns.mostProductiveHours[hour]) {
        patterns.mostProductiveHours[hour] = {
          productivity: 0,
          count: 0
        };
      }
      patterns.mostProductiveHours[hour].productivity += entry.productivity;
      patterns.mostProductiveHours[hour].count++;

      // Analyze breaks
      if (entry.breaks && entry.breaks.length > 0) {
        entry.breaks.forEach(break_ => {
          patterns.breakPatterns.push({
            duration: break_.duration,
            startHour: new Date(break_.startTime).getHours()
          });
        });
      }

      // Analyze task categories
      if (!patterns.taskCategories[entry.category]) {
        patterns.taskCategories[entry.category] = {
          duration: 0,
          productivity: 0,
          count: 0
        };
      }
      patterns.taskCategories[entry.category].duration += entry.duration;
      patterns.taskCategories[entry.category].productivity += entry.productivity;
      patterns.taskCategories[entry.category].count++;
    });

    // Calculate averages
    patterns.mostProductiveHours = patterns.mostProductiveHours
      .map((hour, index) => ({
        hour: index,
        productivity: hour ? hour.productivity / hour.count : 0
      }))
      .sort((a, b) => b.productivity - a.productivity);

    Object.keys(patterns.taskCategories).forEach(category => {
      const cat = patterns.taskCategories[category];
      cat.averageProductivity = cat.productivity / cat.count;
      cat.averageDuration = cat.duration / cat.count;
    });

    return patterns;
  }

  static analyzeTaskCompletion(tasks) {
    const metrics = {
      completionRate: 0,
      averageCompletionTime: 0,
      tasksByPriority: {},
      overdueTasks: 0
    };

    const completedTasks = tasks.filter(task => task.status === 'completed');
    metrics.completionRate = (completedTasks.length / tasks.length) * 100;

    completedTasks.forEach(task => {
      const completionTime = new Date(task.completedAt) - new Date(task.createdAt);
      metrics.averageCompletionTime += completionTime;
    });
    metrics.averageCompletionTime /= completedTasks.length;

    // Analyze tasks by priority
    tasks.forEach(task => {
      if (!metrics.tasksByPriority[task.priority]) {
        metrics.tasksByPriority[task.priority] = {
          total: 0,
          completed: 0
        };
      }
      metrics.tasksByPriority[task.priority].total++;
      if (task.status === 'completed') {
        metrics.tasksByPriority[task.priority].completed++;
      }
    });

    // Count overdue tasks
    metrics.overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length;

    return metrics;
  }

  static generateInsights(patterns, taskMetrics) {
    const insights = [];

    // Productivity insights
    const topHours = patterns.mostProductiveHours.slice(0, 3);
    insights.push({
      type: 'productivity',
      message: `أفضل ساعات الإنتاجية هي: ${topHours.map(h => h.hour).join(', ')}`,
      importance: 'high'
    });

    // Task completion insights
    if (taskMetrics.completionRate < 70) {
      insights.push({
        type: 'completion',
        message: 'معدل إكمال المهام منخفض. قد تحتاج إلى تحسين إدارة الوقت.',
        importance: 'high'
      });
    }

    // Break pattern insights
    const breakPatterns = this.analyzeBreakPatterns(patterns.breakPatterns);
    if (breakPatterns.tooFew) {
      insights.push({
        type: 'breaks',
        message: 'أخذ فترات راحة قليلة جداً قد يؤثر على الإنتاجية.',
        importance: 'medium'
      });
    }

    // Category insights
    Object.entries(patterns.taskCategories).forEach(([category, data]) => {
      if (data.averageProductivity < 70) {
        insights.push({
          type: 'category',
          message: `الإنتاجية منخفضة في فئة ${category}. قد تحتاج إلى مراجعة طريقة العمل.`,
          importance: 'medium'
        });
      }
    });

    return insights;
  }

  static generateRecommendations(insights) {
    const recommendations = [];

    insights.forEach(insight => {
      switch (insight.type) {
        case 'productivity':
          recommendations.push({
            title: 'تحسين الإنتاجية',
            steps: [
              'جدولة المهام المهمة خلال ساعات الذروة',
              'تقليل المقاطعات خلال هذه الفترات',
              'تحديد أهداف يومية واضحة'
            ]
          });
          break;
        case 'completion':
          recommendations.push({
            title: 'تحسين معدل إكمال المهام',
            steps: [
              'تقسيم المهام الكبيرة إلى مهام أصغر',
              'استخدام تقنية بومودورو',
              'تحديد أولويات المهام بشكل يومي'
            ]
          });
          break;
        case 'breaks':
          recommendations.push({
            title: 'تحسين نمط فترات الراحة',
            steps: [
              'أخذ راحة قصيرة كل 90 دقيقة',
              'المشي أو التمدد خلال الراحة',
              'تجنب الشاشات خلال فترات الراحة'
            ]
          });
          break;
      }
    });

    return recommendations;
  }

  static analyzeBreakPatterns(breaks) {
    const averageBreaksPerDay = breaks.length / 7; // assuming weekly data
    return {
      tooFew: averageBreaksPerDay < 3,
      tooMany: averageBreaksPerDay > 8,
      optimalTiming: this.checkOptimalBreakTiming(breaks)
    };
  }

  static checkOptimalBreakTiming(breaks) {
    // Check if breaks are well-distributed throughout the day
    const breakHours = breaks.map(b => b.startHour);
    const distribution = Array(24).fill(0);
    breakHours.forEach(hour => distribution[hour]++);
    
    // Calculate standard deviation of break distribution
    const average = breakHours.length / 24;
    const variance = distribution.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / 24;
    const stdDev = Math.sqrt(variance);

    return stdDev < 1.5; // threshold for good distribution
  }

  static async predictTaskDuration(task, historicalTasks) {
    try {
      // Prepare training data
      const trainingData = historicalTasks.map(t => ({
        features: this.extractTaskFeatures(t),
        duration: t.duration
      }));

      // Train simple linear regression model
      const model = this.trainLinearRegression(trainingData);

      // Predict duration for new task
      const taskFeatures = this.extractTaskFeatures(task);
      const predictedDuration = this.predict(model, taskFeatures);

      return Math.max(0, predictedDuration);
    } catch (error) {
      console.error('Error in task duration prediction:', error);
      throw error;
    }
  }

  static extractTaskFeatures(task) {
    const features = {
      priorityWeight: this.getPriorityWeight(task.priority),
      wordCount: tokenizer.tokenize(task.description || '').length,
      hasDeadline: task.dueDate ? 1 : 0,
      categoryWeight: this.getCategoryWeight(task.category)
    };

    return Object.values(features);
  }

  static getPriorityWeight(priority) {
    const weights = { low: 1, medium: 2, high: 3 };
    return weights[priority] || 2;
  }

  static getCategoryWeight(category) {
    const weights = {
      development: 3,
      design: 2,
      research: 2.5,
      meeting: 1.5,
      other: 2
    };
    return weights[category] || 2;
  }

  static trainLinearRegression(data) {
    // Simple linear regression implementation
    const n = data.length;
    let sumX = Array(data[0].features.length).fill(0);
    let sumY = 0;
    let sumXY = Array(data[0].features.length).fill(0);
    let sumXX = Array(data[0].features.length).fill(0);

    data.forEach(point => {
      point.features.forEach((feature, i) => {
        sumX[i] += feature;
        sumXY[i] += feature * point.duration;
        sumXX[i] += feature * feature;
      });
      sumY += point.duration;
    });

    const coefficients = sumX.map((_, i) => {
      return (n * sumXY[i] - sumX[i] * sumY) / (n * sumXX[i] - sumX[i] * sumX[i]);
    });

    const intercept = (sumY - coefficients.reduce((acc, coef, i) => acc + coef * sumX[i], 0)) / n;

    return { coefficients, intercept };
  }

  static predict(model, features) {
    return features.reduce((acc, feature, i) => acc + feature * model.coefficients[i], model.intercept);
  }
}

module.exports = AIService;
