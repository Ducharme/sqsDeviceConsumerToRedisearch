import { Message } from "@aws-sdk/client-sqs";
import { redisClient } from "./redisClient";
import { sqsClient } from "./sqsClient";


var rec = new redisClient();
var sq = new sqsClient(receivedMessageHandler, messagesReducer, processMessagesHandler);

async function receivedMessageHandler(msg: Message) : Promise<string> {
  return rec.saveDeviceLocation(msg.Body!);
}

function messagesReducer(list: Promise<string>[]) : Promise<string>[] {
  return list;
}

async function processMessagesHandler(list: Promise<string>[]) {
  // TODO: Sort and process messages in order for same device/topic
  // NOTE: Block waiting and processing will have not have messages in order anyways
  await Promise.all(list).catch((err: any) => console.error("Updating redis failed:" + err));
}


const run = async () => {
  rec.connect();
  rec.ping();
  sq.run<Promise<string>>();
}

run();
