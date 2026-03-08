import { UserCognitivePreferences } from "@workspace/domain/entities/user-cognitive-preferences.entity";

export interface IUserCognitivePreferencesRepository {
  findByUserId(userId: string): Promise<UserCognitivePreferences | null>;
  save(prefs: UserCognitivePreferences): Promise<void>;
  update(prefs: UserCognitivePreferences): Promise<void>;
  delete(userId: string): Promise<void>;
}
