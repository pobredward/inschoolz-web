interface Window {
  Kakao: {
    init: (appKey: string) => void;
    isInitialized: () => boolean;
    Auth: {
      login: (options: {
        success: (authObj: any) => void;
        fail: (error: any) => void;
        scope?: string;
      }) => void;
      logout: (callback?: () => void) => void;
      getAccessToken: () => string | null;
    };
    API: {
      request: (options: {
        url: string;
        success?: (response: any) => void;
        fail?: (error: any) => void;
      }) => void;
    };
  };
}

declare namespace Kakao {
  interface AuthObj {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }

  interface UserProfile {
    id: number;
    connected_at: string;
    properties: {
      nickname: string;
      profile_image?: string;
      thumbnail_image?: string;
    };
    kakao_account: {
      profile_nickname_needs_agreement: boolean;
      profile_image_needs_agreement: boolean;
      profile: {
        nickname: string;
        thumbnail_image_url?: string;
        profile_image_url?: string;
        is_default_image: boolean;
      };
      has_email: boolean;
      email_needs_agreement: boolean;
      is_email_valid: boolean;
      is_email_verified: boolean;
      email?: string;
    };
  }
}
