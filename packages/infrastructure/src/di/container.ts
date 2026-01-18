// Repositories
import { UserRepository } from "@workspace/infrastructure/repositories/user.repository";
import { ProjectRepository } from "@workspace/infrastructure/repositories/project.repository";
import { TaskRepository } from "@workspace/infrastructure/repositories/task.repository";
import { SubtaskRepository } from "@workspace/infrastructure/repositories/subtask.repository";
import { TimerSessionRepository } from "@workspace/infrastructure/repositories/timer-session.repository";
import { ArousalEntryRepository } from "@workspace/infrastructure/repositories/arousal-entry.repository";

// Domain Services
import { ArousalAnalyzerService } from "@workspace/domain/domain-services/arousal-analyzer.service";
// import { ProductivityCalculatorService } from "@workspace/domain/domain-services/productivity-calculator.service";
import { TaskSuggestionService } from "@workspace/domain/domain-services/task-suggestion.service";
import { TimerRecommenderService } from "@workspace/domain/domain-services/timer-recommender.service";

// Event Bus
import { InMemoryEventBus } from "@workspace/infrastructure/events/in-memory-event-bus";

// Use Cases - Project
import { CreateProjectUseCase } from "@workspace/application/use-cases/project/create-project.use-case";
import { GetUserProjectsUseCase } from "@workspace/application/use-cases/project/get-user-projects.use-case";
import { UpdateProjectUseCase } from "@workspace/application/use-cases/project/update-project.use-case";
import { DeleteProjectUseCase } from "@workspace/application/use-cases/project/delete-project.use-case";

// Use Cases - Task
import { CreateTaskUseCase } from "@workspace/application/use-cases/task/create-task.use-case";
import { CompleteTaskUseCase } from "@workspace/application/use-cases/task/complete-task.use-case";
import { GetTasksByArousalUseCase } from "@workspace/application/use-cases/task/get-tasks-by-arousal.use-case";
import { UpdateTaskUseCase } from "@workspace/application/use-cases/task/update-task.use-case";

// Use Cases - Timer
import { StartTimerSessionUseCase } from "@workspace/application/use-cases/timer/start-timer-session.use-case";
import { CompleteTimerSessionUseCase } from "@workspace/application/use-cases/timer/complete-timer-session.use-case";
import { GetUserSessionsUseCase } from "@workspace/application/use-cases/timer/get-user-sessions.use-case";

// Use Cases - Arousal
import { RecordArousalUseCase } from "@workspace/application/use-cases/arousal/record-arousal.use-case";
import { GetArousalInsightsUseCase } from "@workspace/application/use-cases/arousal/get-arousal-insights.use-case";
import { GetCurrentArousalUseCase } from "@workspace/application/use-cases/arousal/get-current-arousal.use-case";

// Use Cases - Productivity & Suggestions
import { GetProductivityReportUseCase } from "@workspace/application/use-cases/productivity/get-productivity-report.use-case";
import { GetTaskSuggestionUseCase } from "@workspace/application/use-cases/suggestions/get-task-suggestion.use-case";
import { GetTimerRecommendationUseCase } from "@workspace/application/use-cases/suggestions/get-timer-recommendation.use-case";

/**
 * Dependency Injection Container
 * Singleton pattern - all instances are reused
 */
class Container {
  // Repositories (singleton)
  private _userRepository?: UserRepository;
  private _projectRepository?: ProjectRepository;
  private _taskRepository?: TaskRepository;
  private _subtaskRepository?: SubtaskRepository;
  private _timerSessionRepository?: TimerSessionRepository;
  private _arousalEntryRepository?: ArousalEntryRepository;

  // Domain Services (singleton)
  private _arousalAnalyzerService?: ArousalAnalyzerService;
  private _productivityCalculatorService?: ProductivityCalculatorService;
  private _taskSuggestionService?: TaskSuggestionService;
  private _timerRecommenderService?: TimerRecommenderService;

  // Event Bus (singleton)
  private _eventBus?: InMemoryEventBus;

  // Use Cases (created on demand, but can be cached)

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

  get subtaskRepository(): SubtaskRepository {
    if (!this._subtaskRepository) {
      this._subtaskRepository = new SubtaskRepository();
    }
    return this._subtaskRepository;
  }

  get timerSessionRepository(): TimerSessionRepository {
    if (!this._timerSessionRepository) {
      this._timerSessionRepository = new TimerSessionRepository();
    }
    return this._timerSessionRepository;
  }

  get arousalEntryRepository(): ArousalEntryRepository {
    if (!this._arousalEntryRepository) {
      this._arousalEntryRepository = new ArousalEntryRepository();
    }
    return this._arousalEntryRepository;
  }

  // ========================================================================
  // Domain Services
  // ========================================================================

  get arousalAnalyzerService(): ArousalAnalyzerService {
    if (!this._arousalAnalyzerService) {
      this._arousalAnalyzerService = new ArousalAnalyzerService();
    }
    return this._arousalAnalyzerService;
  }

  get productivityCalculatorService(): ProductivityCalculatorService {
    if (!this._productivityCalculatorService) {
      this._productivityCalculatorService = new ProductivityCalculatorService();
    }
    return this._productivityCalculatorService;
  }

  get taskSuggestionService(): TaskSuggestionService {
    if (!this._taskSuggestionService) {
      this._taskSuggestionService = new TaskSuggestionService(
        this.arousalAnalyzerService,
      );
    }
    return this._taskSuggestionService;
  }

  get timerRecommenderService(): TimerRecommenderService {
    if (!this._timerRecommenderService) {
      this._timerRecommenderService = new TimerRecommenderService();
    }
    return this._timerRecommenderService;
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

  completeTaskUseCase(): CompleteTaskUseCase {
    return new CompleteTaskUseCase(
      this.taskRepository,
      this.projectRepository,
      this.eventBus,
    );
  }

  getTasksByArousalUseCase(): GetTasksByArousalUseCase {
    return new GetTasksByArousalUseCase(
      this.taskRepository,
      this.arousalAnalyzerService,
    );
  }

  updateTaskUseCase(): UpdateTaskUseCase {
    return new UpdateTaskUseCase(this.taskRepository);
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
      this.eventBus,
    );
  }

  getUserSessionsUseCase(): GetUserSessionsUseCase {
    return new GetUserSessionsUseCase(this.timerSessionRepository);
  }

  // ========================================================================
  // Use Cases - Arousal
  // ========================================================================

  recordArousalUseCase(): RecordArousalUseCase {
    return new RecordArousalUseCase(this.arousalEntryRepository, this.eventBus);
  }

  getArousalInsightsUseCase(): GetArousalInsightsUseCase {
    return new GetArousalInsightsUseCase(
      this.arousalEntryRepository,
      this.arousalAnalyzerService,
    );
  }

  getCurrentArousalUseCase(): GetCurrentArousalUseCase {
    return new GetCurrentArousalUseCase(this.arousalEntryRepository);
  }

  // ========================================================================
  // Use Cases - Productivity & Suggestions
  // ========================================================================

  getProductivityReportUseCase(): GetProductivityReportUseCase {
    return new GetProductivityReportUseCase(
      this.timerSessionRepository,
      this.taskRepository,
      this.productivityCalculatorService,
    );
  }

  getTaskSuggestionUseCase(): GetTaskSuggestionUseCase {
    return new GetTaskSuggestionUseCase(
      this.taskRepository,
      this.arousalEntryRepository,
      this.taskSuggestionService,
    );
  }

  getTimerRecommendationUseCase(): GetTimerRecommendationUseCase {
    return new GetTimerRecommendationUseCase(
      this.arousalEntryRepository,
      this.timerRecommenderService,
    );
  }
}

// Export singleton instance
export const container = new Container();
