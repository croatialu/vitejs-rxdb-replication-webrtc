import {
  KeyFunctionMap,
  RxDatabase,
  RxReactivityFactory,
  removeRxDatabase,
} from 'rxdb';
import { addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import {
  userCollectionMethods,
  userDocMethods,
  userSchema,
} from './collections/user';
import type { DatabaseCollections } from './collections';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import { getConnectionHandlerSimplePeer as getConnectionHandlerSimplePeerLocal } from './plugins/replication-webrtc/connection-handler-simple-peer';
import {
  getConnectionHandlerSimplePeer,
  replicateWebRTC,
} from 'rxdb/plugins/replication-webrtc';
import { postSchema } from './collections/post';

addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBCleanupPlugin);

export async function createDatabase() {
  const dbName = 'example_rxdb';
  await removeRxDatabase(dbName, getRxStorageDexie());
  const database = await createRxDatabase<DatabaseCollections>({
    name: dbName,
    storage: getRxStorageDexie(),
    multiInstance: true,
    ignoreDuplicate: true,
  });

  // show leadership in title
  database.waitForLeadership().then(() => {
    console.log('isLeader now');
    document.title = `♛ ${document.title}`;
  });

  await database.addCollections({
    user: {
      schema: userSchema,
    },
    post: {
      schema: postSchema,
    },
  });

  /**
   * OLD, When the number of collections increases, the number of
   * sockets will increase, and the number of peers will also
   * increase
   */
  Object.keys(database.collections).forEach((key) => {
    replicateWebRTC({
      collection:
        database.collections[key as keyof typeof database.collections],
      connectionHandlerCreator: getConnectionHandlerSimplePeer({}),
      topic: `${dbName}__${key}`,
      pull: {},
      push: {},
    });
  });

  /**
   * NEW
   */

  // const result = getConnectionHandlerSimplePeerLocal({});
  // Object.keys(database.collections).forEach((key) => {
  //   replicateWebRTC({
  //     collection:
  //       database.collections[key as keyof typeof database.collections],
  //     connectionHandlerCreator: result,
  //     topic: dbName,
  //     pull: {},
  //     push: {},
  //   });
  // });

  return database;
}

export type Database = RxDatabase<DatabaseCollections, any, any, unknown>;
