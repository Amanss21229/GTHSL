## Packages
firebase | Backend-as-a-Service (Auth, Firestore, Storage)
framer-motion | Smooth animations and page transitions
recharts | Result analysis charts
react-circular-progressbar | Score visualization
react-countdown | Timer for the test interface
lucide-react | Icons (already in base, but emphasizing use)
clsx | Class utility
tailwind-merge | Class utility

## Notes
Using Firebase for all data persistence and authentication as requested.
The app will use a mock implementation if Firebase env vars are missing to allow UI preview.
Admin routes should be protected (conceptually), for now anyone can access /admin for demo purposes.
Images for questions will be stored in Firebase Storage (simulated in demo mode).
