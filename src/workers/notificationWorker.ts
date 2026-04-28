import { Effect, Queue, Schedule } from "effect";
import type { NotificationJob } from "./queue";

const sendNotification = (job: NotificationJob) =>
  Effect.gen(function* () {
    console.log(`[Notification] Processing job: ${job.type}`);
    console.log(`[Notification] Transfer reference: ${job.payload.reference}`);
    console.log(`[Notification] Amount: NGN ${job.payload.amount}`);

    // Simulate sending email/SMS
    // In production this would call Resend, Termii, or Twilio
    yield* Effect.sleep("100 millis");

    console.log(`[Notification] Receipt sent for ${job.payload.reference}`);
  });

const processJob = (job: NotificationJob) =>
  sendNotification(job).pipe(
    Effect.retry(
      Schedule.exponential("1 second").pipe(
        Schedule.compose(Schedule.recurs(3)),
      ),
    ),
    Effect.catchAll((error) =>
      Effect.sync(() =>
        console.error(`[Notification] Job failed after retries:`, error),
      ),
    ),
  );

export const startNotificationWorker = (queue: Queue.Queue<NotificationJob>) =>
  Effect.gen(function* () {
    console.log("[Worker] Notification worker started");

    while (true) {
      const job = yield* Queue.take(queue);
      yield* processJob(job);
    }
  });
