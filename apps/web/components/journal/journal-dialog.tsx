"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import { Plus, Trash2, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import {
  useJournalEntries,
  useCreateJournalEntry,
  useDeleteJournalEntry,
} from "@workspace/frontend/hooks/queries/use-journal-queries";
import { MOOD_CONFIGS, type MoodType } from "@workspace/core/mood/types";

interface JournalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JournalDialog({ open, onOpenChange }: JournalDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodType>("neutral");

  const { data: entries, isLoading } = useJournalEntries();
  const createMutation = useCreateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  const handleCreate = () => {
    if (!newContent.trim()) return;

    createMutation.mutate(
      {
        title: newTitle.trim() || undefined,
        content: newContent.trim(),
        mood: selectedMood,
      },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewContent("");
          setSelectedMood("neutral");
          setIsCreating(false);
        },
      },
    );
  };

  const handleDelete = (entryId: string) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      deleteMutation.mutate(entryId);
    }
  };
  console.log("Journal opened", open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Journal Entries</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Create New Entry */}
            {isCreating ? (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">New Entry</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setNewTitle("");
                      setNewContent("");
                      setSelectedMood("neutral");
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                <Input
                  placeholder="Title (optional)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />

                <Textarea
                  placeholder="What's on your mind?"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="min-h-[120px]"
                />

                {/* Mood Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    How are you feeling?
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(MOOD_CONFIGS).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedMood(key as MoodType)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                          selectedMood === key
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <span className="text-lg">{config.icon}</span>
                        <span className="text-sm">{config.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={!newContent.trim() || createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Entry"
                  )}
                </Button>
                {/* Journal Tips */}
                <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-2">💡 Journaling Tips:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Write about wins, no matter how small</li>
                    <li>Note what helped you focus today</li>
                    <li>Reflect on challenges and solutions</li>
                    <li>Track patterns in your productivity</li>
                  </ul>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsCreating(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            )}

            {/* Entries List */}
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {entries && entries.length > 0 ? (
                  entries.map((entry) => {
                    const moodConfig = entry.mood
                      ? MOOD_CONFIGS[entry.mood]
                      : null;

                    return (
                      <div
                        key={entry.id}
                        className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {moodConfig && (
                              <span className="text-2xl">
                                {moodConfig.icon}
                              </span>
                            )}
                            <div>
                              {entry.title && (
                                <h4 className="font-semibold text-sm">
                                  {entry.title}
                                </h4>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(entry.createdAt),
                                  "MMM d, yyyy 'at' h:mm a",
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-sm whitespace-pre-wrap">
                          {entry.content}
                        </p>

                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {entry.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No journal entries yet. Start writing!
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
