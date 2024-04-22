import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { RxCollection, RxQuery } from 'rxdb';
import { UserCollection, UserDocType } from '../../db/collections/user';
import { nanoid } from 'nanoid';

interface ListProps {
  title: string;
  collection: UserCollection;
}

export const UserList = ({
  title,
  collection,
}: PropsWithChildren<ListProps>) => {
  const [text, setText] = useState('');
  const [list, setList] = useState<UserDocType[]>([]);

  const handleAdd = async () => {
    setText('');

    collection.insert({
      name: text,
      nanoId: nanoid(21),
      createAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (nanoId: string) => {
    collection.bulkRemove([nanoId]);
  };

  useEffect(() => {
    const sub = collection
      .find({
        sort: [
          {
            createAt: 'asc',
          },
        ],
      })
      .$.subscribe((data) => {
        setList(data.map((v) => v.toJSON()));
      });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  return (
    <div style={{ border: '1px solid black', padding: 4 }}>
      <div>{title}</div>
      <div>Collection Name: {collection.name}</div>
      <div>
        <input
          placeholder="please enter"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={() => handleAdd()}>Add</button>
      </div>
      <ul>
        {list.map((item) => {
          return (
            <li key={item.nanoId}>
              <span>{item.name}</span>
              <button onClick={() => handleDelete(item.nanoId)}>Delete</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
