import { IUserRepository } from "@workspace/application/interfaces/repositories/user.repository.interface";
import { User } from "@workspace/domain/entities/user.entity";
import { supabase } from "@workspace/infrastructure/database/supabase-client";
import { UserRow } from "@workspace/infrastructure/database/supabase-types";

export class UserRepository implements IUserRepository {
  private mapRowToEntity(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.mapRowToEntity(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) return null;
    return this.mapRowToEntity(data);
  }

  async save(user: User): Promise<void> {
    const { error } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
    });

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  async update(user: User): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({
        email: user.email,
        name: user.name ?? null,
      })
      .eq("id", user.id);

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}
