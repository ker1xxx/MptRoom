# Базовый образ для запуска
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5198

# Образ для сборки
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Копируем только .csproj, чтобы кэшировать restore
COPY ["MptRoomAPI/MptRoomAPI.csproj", "MptRoomAPI/"]
RUN dotnet restore "MptRoomAPI/MptRoomAPI.csproj"

# Копируем все исходники
COPY . . 
WORKDIR "/src/MptRoomAPI"

# Сборка проекта
RUN dotnet build "MptRoomAPI.csproj" -c Release -o /app/build

# Публикация (без UseAppHost = true — контейнер будет меньше)
RUN dotnet publish "MptRoomAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Финальный контейнер
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish . 
ENTRYPOINT ["dotnet", "MptRoomAPI.dll"]