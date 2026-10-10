using Aplicacion.Configs;
using Aplicacion.Interfaces;
using Aplicacion.Interfaces.IRepositorios;
using Aplicacion.Interfaces.IServicios;
using Aplicacion.Servicios;
using Infraestructura.Conexion;
using Infraestructura.Repositorios;
using Infraestructura.Servicios;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using BitacoraActividades.Middlewares;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Bitácora de Actividades API",
        Version = "v1.2.0"
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://127.0.0.1:5500",
                "127.0.0.1:5500",
                "http://127.0.0.1:5500",
                "https://app")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});
builder.Services.AddScoped<IUsuarioServicio, UsuarioServicio>();
builder.Services.AddScoped<ITicketServicio, TicketServicio>();
builder.Services.AddScoped<IBitacoraServicio, BitacoraServicio>();
builder.Services.AddScoped<IAmpliacionServicio, AmpliacionServicio>();
builder.Services.AddScoped<IAsignacionServicio, AsignacionServicio>();
builder.Services.AddScoped<IRolServicio, RolServicio>();
builder.Services.AddScoped<IEstadoServicio, EstadoServicio>();
builder.Services.AddScoped<IRepositorioAsignacion, RepositorioAsignacion>();
builder.Services.AddScoped<IRepositorioRol, RepositorioRol>();
builder.Services.AddScoped<IRepositorioEstado, RepositorioEstado>();
builder.Services.AddScoped<IRepositorioUsuario, RepositorioUsuario>();
builder.Services.AddScoped<IRepositorioTicket, RepositorioTicket>();
builder.Services.AddScoped<IRepositorioBitacora, RepositorioBitacora>();
builder.Services.AddScoped<IRepositorioAsignacion, RepositorioAsignacion>();
builder.Services.AddScoped<IRepositorioAmpliacion, RepositorioAmpliacion>();
builder.Services.AddScoped<IDBConexion, DBConexion>();
builder.Services.AddScoped<IEncriptar, Encriptar>();
builder.Services.AddScoped<ILog4net, Log4Net>();
builder.Services.AddScoped<IEtapaServicio, EtapaServicio>();
builder.Services.AddScoped<IActividadServicio, ActividadServicio>();
builder.Services.AddScoped<IRepositorioEtapa, RepositorioEtapa>();
builder.Services.AddScoped<IRepositorioActividad, RepositorioActividad>();
builder.Services.AddScoped<IRepositorioLogBD, RepositorioLogBD>();
builder.Services.AddScoped<ITareaServicio, TareaServicio>();
builder.Services.AddScoped<IRepositorioTarea, RepositorioTarea>();
builder.Services.Configure<AutorizacionWidgetSettings>(builder.Configuration.GetSection("AutorizacionWidget"));


// Autenticación por cookie: el inicio de sesión valida contra Active Directory (servicio SOAP)
builder.Services.AddHttpClient<IActiveDirectorySoapServicio, ActiveDirectorySoapServicio>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromHours(12);

        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireAssertion(ctx =>
        {
            var dn = ctx.User.FindFirst("DistinguishedName")?.Value ?? "";
            return dn.Contains("OU=Tecnologia", StringComparison.OrdinalIgnoreCase);
        })
        .Build();
});

var app = builder.Build();

// Pipeline
// El middleware de excepciones va PRIMERO. Así envuelve todo lo demás
// (Swagger, Cors, Authentication, Authorization) y también queda registrado
// lo que pasa en requests que terminan en 401/403 o que revientan dentro de
// esos middlewares, cosa que antes se perdía porque este middleware estaba
// después de UseAuthorization.
app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();