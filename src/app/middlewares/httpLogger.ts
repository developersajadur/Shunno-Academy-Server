import morgan from 'morgan';
import { logger } from '../shared/logger';

// Stream morgan logs directly to winston logger
const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);

export default httpLogger;

