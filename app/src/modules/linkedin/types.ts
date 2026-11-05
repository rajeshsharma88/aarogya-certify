// LinkedIn OAuth and UGC integration types

export interface LinkedInOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export interface LinkedInAccessToken {
  accessToken: string;
  expiresIn: number;
  issuedAt: number;
}

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: string;
}

export interface LinkedInUGCPost {
  id: string;
  text: string;
  media?: {
    id: string;
  };
}

export interface CertificateBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  issuedOn: string;
  expiresOn?: string;
  credentialId: string;
  credentialUrl: string;
  issuer: {
    id: string;
    name: string;
  };
}

export interface LinkedInCredentialPayload {
  credentialMetadata: {
    credentialId: string;
    credentialName: string;
    issuerId: string;
    issuerName: string;
  };
  credentialUrl: string;
}
