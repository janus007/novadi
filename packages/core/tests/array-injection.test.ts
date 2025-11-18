import { describe, it, expect, beforeEach } from 'vitest'
import { Container } from '../src/container'

describe('Array Injection - IFoo[] Syntax', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('should inject array of plugins using IPlugin[] syntax', () => {
    // Arrange
    interface IPlugin {
      name: string
      execute(): string
    }

    class ValidationPlugin implements IPlugin {
      name = 'validation'
      execute(): string {
        return 'validated'
      }
    }

    class AuthPlugin implements IPlugin {
      name = 'auth'
      execute(): string {
        return 'authenticated'
      }
    }

    class LoggingPlugin implements IPlugin {
      name = 'logging'
      execute(): string {
        return 'logged'
      }
    }

    class PluginHost {
      constructor(public plugins: IPlugin[]) {}

      executeAll(): string[] {
        return this.plugins.map(p => p.execute())
      }
    }

    // Act
    const builder = container.builder()
    builder.registerType(ValidationPlugin).as<IPlugin>()
    builder.registerType(AuthPlugin).as<IPlugin>()
    builder.registerType(LoggingPlugin).as<IPlugin>()
    builder.registerType(PluginHost).as<PluginHost>()

    const app = builder.build()
    const host = app.resolveType<PluginHost>()

    // Assert
    expect(host).toBeInstanceOf(PluginHost)
    expect(host.plugins).toHaveLength(3)
    expect(host.plugins[0]).toBeInstanceOf(ValidationPlugin)
    expect(host.plugins[1]).toBeInstanceOf(AuthPlugin)
    expect(host.plugins[2]).toBeInstanceOf(LoggingPlugin)
    expect(host.executeAll()).toEqual(['validated', 'authenticated', 'logged'])
  })

  it('should inject empty array when no registrations exist', () => {
    // Arrange
    interface IPlugin {
      execute(): string
    }

    class PluginHost {
      constructor(public plugins: IPlugin[]) {}
    }

    // Act
    const builder = container.builder()
    builder.registerType(PluginHost).as<PluginHost>()

    const app = builder.build()
    const host = app.resolveType<PluginHost>()

    // Assert
    expect(host).toBeInstanceOf(PluginHost)
    expect(host.plugins).toEqual([])
    expect(host.plugins).toHaveLength(0)
  })
})

describe('Array Injection - Array<IFoo> Syntax', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('should inject array using Array<IPlugin> generic syntax', () => {
    // Arrange
    interface IPlugin {
      name: string
      execute(): string
    }

    class Plugin1 implements IPlugin {
      name = 'plugin1'
      execute(): string {
        return 'result1'
      }
    }

    class Plugin2 implements IPlugin {
      name = 'plugin2'
      execute(): string {
        return 'result2'
      }
    }

    class PluginManager {
      constructor(public plugins: Array<IPlugin>) {}

      count(): number {
        return this.plugins.length
      }
    }

    // Act
    const builder = container.builder()
    builder.registerType(Plugin1).as<IPlugin>()
    builder.registerType(Plugin2).as<IPlugin>()
    builder.registerType(PluginManager).as<PluginManager>()

    const app = builder.build()
    const manager = app.resolveType<PluginManager>()

    // Assert
    expect(manager).toBeInstanceOf(PluginManager)
    expect(manager.plugins).toHaveLength(2)
    expect(manager.count()).toBe(2)
    expect(manager.plugins[0]).toBeInstanceOf(Plugin1)
    expect(manager.plugins[1]).toBeInstanceOf(Plugin2)
  })
})

describe('Array Injection - Mixed Dependencies', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('should inject mixed single and array dependencies', () => {
    // Arrange
    interface ILogger {
      log(message: string): void
      messages: string[]
    }

    class ConsoleLogger implements ILogger {
      messages: string[] = []
      log(message: string) {
        this.messages.push(message)
      }
    }

    interface IPlugin {
      name: string
    }

    class Plugin1 implements IPlugin {
      name = 'plugin1'
    }

    class Plugin2 implements IPlugin {
      name = 'plugin2'
    }

    class Service {
      constructor(
        public logger: ILogger,
        public plugins: IPlugin[],
        public apiKey: string
      ) {}

      logPluginNames() {
        this.plugins.forEach(p => this.logger.log(p.name))
      }
    }

    // Act
    const builder = container.builder()
    builder.registerType(ConsoleLogger).as<ILogger>()
    builder.registerType(Plugin1).as<IPlugin>()
    builder.registerType(Plugin2).as<IPlugin>()
    builder.registerType(Service).as<Service>().autoWire({
      map: {
        logger: (c) => c.resolveType<ILogger>(),
        plugins: (c) => c.resolveTypeAll<IPlugin>(),
        apiKey: () => 'test-api-key-123'
      }
    })

    const app = builder.build()
    const service = app.resolveType<Service>()

    // Assert
    expect(service).toBeInstanceOf(Service)
    expect(service.logger).toBeInstanceOf(ConsoleLogger)
    expect(service.plugins).toHaveLength(2)
    expect(service.apiKey).toBe('test-api-key-123')

    service.logPluginNames()
    expect(service.logger.messages).toEqual(['plugin1', 'plugin2'])
  })

  it('should handle primitives alongside array dependencies', () => {
    // Arrange
    interface IHandler {
      handle(): void
    }

    class Handler1 implements IHandler {
      handle() {}
    }

    class Handler2 implements IHandler {
      handle() {}
    }

    class Pipeline {
      constructor(
        public name: string,
        public handlers: IHandler[],
        public timeout: number
      ) {}
    }

    // Act
    const builder = container.builder()
    builder.registerType(Handler1).as<IHandler>()
    builder.registerType(Handler2).as<IHandler>()
    builder.registerType(Pipeline).as<Pipeline>().autoWire({
      map: {
        name: () => 'test-pipeline',
        handlers: (c) => c.resolveTypeAll<IHandler>(),
        timeout: () => 5000
      }
    })

    const app = builder.build()
    const pipeline = app.resolveType<Pipeline>()

    // Assert
    expect(pipeline.name).toBe('test-pipeline')
    expect(pipeline.handlers).toHaveLength(2)
    expect(pipeline.timeout).toBe(5000)
  })
})

describe('Array Injection - Readonly Arrays', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('should inject readonly array of plugins', () => {
    // Arrange
    interface IPlugin {
      execute(): string
    }

    class Plugin1 implements IPlugin {
      execute(): string {
        return 'plugin1'
      }
    }

    class Plugin2 implements IPlugin {
      execute(): string {
        return 'plugin2'
      }
    }

    class PluginRegistry {
      constructor(public readonly plugins: readonly IPlugin[]) {}

      getPluginCount(): number {
        return this.plugins.length
      }
    }

    // Act
    const builder = container.builder()
    builder.registerType(Plugin1).as<IPlugin>()
    builder.registerType(Plugin2).as<IPlugin>()
    builder.registerType(PluginRegistry).as<PluginRegistry>()

    const app = builder.build()
    const registry = app.resolveType<PluginRegistry>()

    // Assert
    expect(registry).toBeInstanceOf(PluginRegistry)
    expect(registry.plugins).toHaveLength(2)
    expect(registry.getPluginCount()).toBe(2)
  })
})

describe('Array Injection - Lifetimes', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('should respect singleton lifetime for array dependencies', () => {
    // Arrange
    interface IPlugin {
      id: number
    }

    let pluginIdCounter = 0

    class Plugin implements IPlugin {
      id: number
      constructor() {
        this.id = ++pluginIdCounter
      }
    }

    class Host {
      constructor(public plugins: IPlugin[]) {}
    }

    // Act
    const builder = container.builder()
    builder.registerType(Plugin).as<IPlugin>() // Singleton by default
    builder.registerType(Host).as<Host>().instancePerDependency() // Make Host transient to test

    const app = builder.build()
    const host1 = app.resolveType<Host>()
    const host2 = app.resolveType<Host>()

    // Assert
    expect(host1.plugins).toHaveLength(1)
    expect(host2.plugins).toHaveLength(1)
    // Same singleton plugin instance should be injected in both hosts
    expect(host1.plugins[0]).toBe(host2.plugins[0])
    expect(host1.plugins[0].id).toBe(1)
  })

  it('should respect transient lifetime for array dependencies', () => {
    // Arrange
    interface IPlugin {
      id: number
    }

    let pluginIdCounter = 0

    class Plugin implements IPlugin {
      id: number
      constructor() {
        this.id = ++pluginIdCounter
      }
    }

    class Host {
      constructor(public plugins: IPlugin[]) {}
    }

    // Act
    const builder = container.builder()
    builder.registerType(Plugin).as<IPlugin>().instancePerDependency() // Transient
    builder.registerType(Host).as<Host>().instancePerDependency() // Make Host transient too!

    const app = builder.build()
    const host1 = app.resolveType<Host>()
    const host2 = app.resolveType<Host>()

    // Assert
    expect(host1.plugins).toHaveLength(1)
    expect(host2.plugins).toHaveLength(1)
    // Different plugin instances should be created for each host
    expect(host1.plugins[0]).not.toBe(host2.plugins[0])
    expect(host1.plugins[0].id).toBe(1)
    expect(host2.plugins[0].id).toBe(2)
  })
})

describe('Array Injection - Multiple Array Parameters', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('should inject multiple different array types in same constructor', () => {
    // Arrange
    interface IValidator {
      validate(): boolean
    }

    interface IHandler {
      handle(): void
    }

    class Validator1 implements IValidator {
      validate(): boolean { return true }
    }

    class Handler1 implements IHandler {
      handle() {}
    }

    class Handler2 implements IHandler {
      handle() {}
    }

    class ComplexService {
      constructor(
        public validators: IValidator[],
        public handlers: IHandler[]
      ) {}
    }

    // Act
    const builder = container.builder()
    builder.registerType(Validator1).as<IValidator>()
    builder.registerType(Handler1).as<IHandler>()
    builder.registerType(Handler2).as<IHandler>()
    builder.registerType(ComplexService).as<ComplexService>()

    const app = builder.build()
    const service = app.resolveType<ComplexService>()

    // Assert
    expect(service.validators).toHaveLength(1)
    expect(service.handlers).toHaveLength(2)
    expect(service.validators[0]).toBeInstanceOf(Validator1)
    expect(service.handlers[0]).toBeInstanceOf(Handler1)
    expect(service.handlers[1]).toBeInstanceOf(Handler2)
  })
})
