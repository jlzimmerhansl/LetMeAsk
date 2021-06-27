import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { RoomCode } from '../components/RoomCode';
import logoImg from '../assets/images/logo.svg';

import '../styles/rooms.scss';
import { database } from '../services/firebase';

type firebaserQuestions = Record<
  string,
  {
    author: {
      name: string;
      avatar: string;
    };
    content: string;
    isAnswered: boolean;
    isHighlighted: boolean;
  }
>;

type RoomParams = {
  id: string;
};

type Question = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  isAnswered: boolean;
  isHighlighted: boolean;
};

export function Room() {
  const { user } = useAuth();
  const params = useParams<RoomParams>();
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const rommId = params.id;

  useEffect(() => {
    const roomRef = database.ref(`rooms/${rommId}`);

    roomRef.on('value', (room) => {
      const databaseRoom = room.val();
      const firebaserQuestions: firebaserQuestions =
        databaseRoom.questions ?? {};
      const parsedQuestions = Object.entries(firebaserQuestions).map(
        ([key, value]) => {
          return {
            id: key,
            content: value.content,
            author: value.author,
            isHighlighted: value.isHighlighted,
            isAnswered: value.isAnswered,
          };
        }
      );
      setTitle(databaseRoom.title);
      setQuestions(parsedQuestions);
    });
  }, [rommId]);

  async function handleSendQuestion(event: FormEvent) {
    event.preventDefault();
    if (newQuestion.trim() === '') {
      return;
    }

    if (!user) {
      throw new Error('Ypu must be logged in');
    }

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar,
      },
      isHighlighted: false,
      isAnswered: false,
    };

    await database.ref(`rooms/${rommId}/questions`).push(question);

    setNewQuestion('');
  }

  return (
    <div className="page-room">
      <header>
        <div className="content">
          <img src={logoImg} alt="Lemeask" />
          <RoomCode code={rommId} />
        </div>
      </header>
      <main>
        <div className="room-title">
          <h1>Sala {title}</h1>
          {questions.length > 0 && <span>{questions.length} perguntas</span>}
        </div>
        <form onSubmit={handleSendQuestion}>
          <textarea
            placeholder="O que você quer perguntar"
            onChange={(event) => setNewQuestion(event.target.value)}
            value={newQuestion}
          />

          <div className="form-footer">
            {user ? (
              <div className="user-info">
                <img src={user.avatar} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ) : (
              <span>
                Para enviar uma pergunta, <button>faça seu login</button>
              </span>
            )}
            <Button type="submit" disabled={!user}>
              Enviar Pergunta
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
