declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    [key: string]: any;
  }
  export function getAuth(app?: any): any;
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export class GoogleAuthProvider {
    constructor();
    addScope(scope: string): any;
    static credentialFromResult(result: any): any;
  }
  export function onAuthStateChanged(auth: any, callback: (user: User | null) => void): () => void;
}
