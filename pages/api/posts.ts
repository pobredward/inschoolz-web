import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { title, content, author } = req.body;
      const docRef = await addDoc(collection(db, 'posts'), {
        title,
        content,
        author,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json({ id: docRef.id, message: 'Post created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error creating post' });
    }
  } else if (req.method === 'GET') {
    try {
      const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(postsQuery);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching posts' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}