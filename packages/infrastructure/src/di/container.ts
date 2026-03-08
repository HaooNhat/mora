// Repositories
import { ProjectRepository } from "@workspace/infrastructure/repositories/project.repository";
import { TaskRepository } from "@workspace/infrastructure/repositories/task.repository";
import { TimerSessionRepository } from "@workspace/infrastructure/repositories/timer-session.repository";
import { UserRepository } from "@workspace/infrastructure/repositories/user.repository";
// import { ArousalEntryRepository } from "@workspace/infrastructure/repositories/arousal-entry.repository";
import { UserCognitivePreferencesRepository } from "@workspace/infrastructure/repositories/user-cognitive-preferences.repository";

// Domain Services
import { MoraCompanionService } from "@workspace/domain/domain-services/mora-companion.service";

// Event Bus
import { InMemoryEventBus } from "@workspace/infrastructure/events/in-memory-event-bus";

// Use Cases - Project
import { CreateProjectUseCase } from "@workspace/application/use-cases/project/create-project.use-case";
import { DeleteProjectUseCase } from "@workspace/application/use-cases/project/delete-project.use-case";
import { GetUserProjectsUseCase } from "@workspace/application/use-cases/project/get-user-projects.use-case";
import { UpdateProjectUseCase } from "@workspace/application/use-cases/project/update-project.use-case";

// Use Cases - Task
import { CompleteTaskUseCase } from "@workspace/application/use-cases/task/complete-task.use-case";
import { CreateTaskUseCase } from "@workspace/application/use-cases/task/create-task.use-case";
import { DeleteTaskUseCase } from "@workspace/application/use-cases/task/delete-task.use-case";
import { GetUserTasksUseCase } from "@workspace/application/use-cases/task/get-user-tasks.use-case";
import { UpdateTaskUseCase } from "@workspace/application/use-cases/task/update-task.use-case";

// Use Cases - Subtask Operations
import {
  AddSubtaskUseCase,
  DeleteSubtaskUseCase,
  ReorderSubtasksUseCase,
  ToggleSubtaskUseCase,
  UpdateSubtaskTextUseCase,
} from "@workspace/application/use-cases/task/subtask-operations.use-case";

// Use Cases - Timer
import { CompleteTimerSessionUseCase } from "@workspace/application/use-cases/timer/complete-timer-session.use-case";
import { GetUserSessionsUseCase } from "@workspace/application/use-cases/timer/get-user-sessions.use-case";
import { StartTimerSessionUseCase } from "@workspace/application/use-cases/timer/start-timer-session.use-case";

// Use Cases - Arousal & Mora Companion
// import { RecordArousalUseCase } from "@workspace/application/use-cases/arousal/record-arousal.use-case";
// import { GetMoraSuggestionsUseCase } from "@workspace/application/use-cases/mora/get-mora-suggestions.use-case";

/**
 * Dependency Injection Container
 */
class Container {
  // Repositories (singleton)
  private _userRepository?: UserRepository;
  private _projectRepository?: ProjectRepository;
  private _taskRepository?: TaskRepository;
  private _timerSessionRepository?: TimerSessionRepository;
  // private _arousalEntryRepository?: ArousalEntryRepository;
  private _cognitivePreferencesRepository?: UserCognitivePreferencesRepository;

  // Domain Services (singleton)
  private _moraCompanionService?: MoraCompanionService;

  // Event Bus (singleton)
  private _eventBus?: InMemoryEventBus;

  // ========================================================================
  // Repositories
  // ========================================================================

  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
    }
    return this._userRepository;
  }

  get projectRepository(): ProjectRepository {
    if (!this._projectRepository) {
      this._projectRepository = new ProjectRepository();
    }
    return this._projectRepository;
  }

  get taskRepository(): TaskRepository {
    if (!this._taskRepository) {
      this._taskRepository = new TaskRepository();
    }
    return this._taskRepository;
  }

  get timerSessionRepository(): TimerSessionRepository {
    if (!this._timerSessionRepository) {
      this._timerSessionRepository = new TimerSessionRepository();
    }
    return this._timerSessionRepository;
  }

  // get arousalEntryRepository(): ArousalEntryRepository {
  //   if (!this._arousalEntryRepository) {
  //     this._arousalEntryRepository = new ArousalEntryRepository();
  //   }
  //   return this._arousalEntryRepository;
  // }

  get cognitivePreferencesRepository(): UserCognitivePreferencesRepository {
    if (!this._cognitivePreferencesRepository) {
      this._cognitivePreferencesRepository =
        new UserCognitivePreferencesRepository();
    }
    return this._cognitivePreferencesRepository;
  }

  // ========================================================================
  // Domain Services
  // ========================================================================

  get moraCompanionService(): MoraCompanionService {
    if (!this._moraCompanionService) {
      this._moraCompanionService = new MoraCompanionService();
    }
    return this._moraCompanionService;
  }

  // ========================================================================
  // Event Bus
  // ========================================================================

  get eventBus(): InMemoryEventBus {
    if (!this._eventBus) {
      this._eventBus = new InMemoryEventBus();
    }
    return this._eventBus;
  }

  // ========================================================================
  // Use Cases - Project
  // ========================================================================

  createProjectUseCase(): CreateProjectUseCase {
    return new CreateProjectUseCase(this.projectRepository);
  }

  getUserProjectsUseCase(): GetUserProjectsUseCase {
    return new GetUserProjectsUseCase(this.projectRepository);
  }

  updateProjectUseCase(): UpdateProjectUseCase {
    return new UpdateProjectUseCase(this.projectRepository);
  }

  deleteProjectUseCase(): DeleteProjectUseCase {
    return new DeleteProjectUseCase(
      this.projectRepository,
      this.taskRepository,
    );
  }

  // ========================================================================
  // Use Cases - Task
  // ========================================================================

  createTaskUseCase(): CreateTaskUseCase {
    return new CreateTaskUseCase(
      this.taskRepository,
      this.projectRepository,
      this.eventBus,
    );
  }

  updateTaskUseCase(): UpdateTaskUseCase {
    return new UpdateTaskUseCase(this.taskRepository);
  }

  deleteTaskUseCase(): DeleteTaskUseCase {
    return new DeleteTaskUseCase(this.taskRepository);
  }

  completeTaskUseCase(): CompleteTaskUseCase {
    return new CompleteTaskUseCase(
      this.taskRepository,
      // this.projectRepository,
      this.eventBus,
    );
  }

  // ========================================================================
  // Use Cases - Subtask Operations
  // ========================================================================

  getUserTasksUseCase(): GetUserTasksUseCase {
    return new GetUserTasksUseCase(this.taskRepository);
  }

  addSubtaskUseCase(): AddSubtaskUseCase {
    return new AddSubtaskUseCase(this.taskRepository);
  }

  updateSubtaskUseCase(): UpdateSubtaskTextUseCase {
    return new UpdateSubtaskTextUseCase(this.taskRepository);
  }

  toggleSubtaskUseCase(): ToggleSubtaskUseCase {
    return new ToggleSubtaskUseCase(this.taskRepository);
  }

  deleteSubtaskUseCase(): DeleteSubtaskUseCase {
    return new DeleteSubtaskUseCase(this.taskRepository);
  }

  reorderSubtasksUseCase(): ReorderSubtasksUseCase {
    return new ReorderSubtasksUseCase(this.taskRepository);
  }

  // ========================================================================
  // Use Cases - Timer
  // ========================================================================

  startTimerSessionUseCase(): StartTimerSessionUseCase {
    return new StartTimerSessionUseCase(
      this.timerSessionRepository,
      this.eventBus,
    );
  }

  completeTimerSessionUseCase(): CompleteTimerSessionUseCase {
    return new CompleteTimerSessionUseCase(
      this.timerSessionRepository,
      // this.cognitivePreferencesRepository,
      // this.taskRepository,
      this.eventBus,
    );
  }

  getUserSessionsUseCase(): GetUserSessionsUseCase {
    return new GetUserSessionsUseCase(this.timerSessionRepository);
  }

  // ========================================================================
  // Use Cases - Arousal & Mora Companion
  // ========================================================================

  // recordArousalUseCase(): RecordArousalUseCase {
  //   return new RecordArousalUseCase(
  //     this.arousalEntryRepository,
  //     this.cognitivePreferencesRepository,
  //   );
  // }

  // getMoraSuggestionsUseCase(): GetMoraSuggestionsUseCase {
  //   return new GetMoraSuggestionsUseCase(
  //     this.taskRepository,
  //     this.arousalEntryRepository,
  //     this.cognitivePreferencesRepository,
  //   );
  // }
}

// Export singleton instance
export const container = new Container();
