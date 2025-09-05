// Simple console logger for serverless environments
const logLevel = process.env['LOG_LEVEL'] || 'info';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const shouldLog = (level: string) => {
  return logLevels[level as keyof typeof logLevels] <= logLevels[logLevel as keyof typeof logLevels];
};

const formatMessage = (level: string, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
};

// Simple logger implementation
export const logger = {
  error: (message: string, meta?: any) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },
  warn: (message: string, meta?: any) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  info: (message: string, meta?: any) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, meta));
    }
  },
  http: (message: string, meta?: any) => {
    if (shouldLog('http')) {
      console.log(formatMessage('http', message, meta));
    }
  },
  debug: (message: string, meta?: any) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, meta));
    }
  },
};

// Add stream for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logRequest = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

export const logError = (error: Error, req?: any) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: req?.originalUrl,
    method: req?.method,
    ip: req?.ip || req?.connection?.remoteAddress,
    userId: req?.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  };
  
  logger.error('Application Error', errorData);
};

export const logSecurity = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userId: details.userId || 'anonymous',
  });
};

export const logDatabase = (operation: string, details: any) => {
  logger.debug('Database Operation', {
    operation,
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logPayment = (event: string, details: any) => {
  logger.info('Payment Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    userId: details.userId || 'anonymous',
    amount: details.amount,
    currency: details.currency,
  });
};

// Export default logger
export default logger;
