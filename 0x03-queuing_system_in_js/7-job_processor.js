#!/usr/bin/env babel-node
import { createQueue } from 'kue';

const queue = createQueue();
const blacklistedNumbers = ['4153518780', '4153518781'];

function sendNotification(phoneNumber, message, job, done) {
  job.progress(0, 100);

  if (!blacklistedNumbers.includes(phoneNumber)) {
    job.progress(50, 100);
    console.log(
      `Sending notification to ${phoneNumber}, with message: ${message}`,
    );
    done();
  }
  return done(new Error(`Phone number ${phoneNumber} is blacklisted`));
}

queue.process('push_notification_code_2', 2, (job, done) => {
  const { phoneNumber, message } = job.data;
  sendNotification(phoneNumber, message, job, done);
});
