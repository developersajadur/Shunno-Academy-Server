import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, label, printf, colorize } = format;

// Custom log format for clean and readable console output
const myFormat = printf(({ level, message, label, timestamp, stack }) => {
  const date = new Date(timestamp as string);
  const timeStr = date.toLocaleTimeString('en-US', { hour12: false });
  return `${timeStr} [${label}] ${level}: ${stack || message}`;
});

export const logger = createLogger({
  level: 'info',
  format: combine(label({ label: 'SHUNNO-ACADEMY' }), timestamp(), myFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), label({ label: 'SHUNNO-ACADEMY' }), timestamp(), myFormat),
    }),
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'winston', 'successes', 'shunno-%DATE%-success.log'),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export const errorLogger = createLogger({
  level: 'error',
  format: combine(label({ label: 'SHUNNO-ACADEMY' }), timestamp(), myFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), label({ label: 'SHUNNO-ACADEMY' }), timestamp(), myFormat),
    }),
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'winston', 'errors', 'shunno-%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export default {
  logger,
  errorLogger,
};
