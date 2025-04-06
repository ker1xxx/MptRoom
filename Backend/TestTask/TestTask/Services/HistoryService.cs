using System;
using System.Collections.Generic;
using Bogus;
using TestTask.Models;

namespace TestTask.Services
{
    public class HistoryService : IHistoryLoader
    {
        private static readonly string[] Tickers = { "BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT", "DOGEUSDT" };

        public List<HistoryPosition> GenerateTradeHistroy()
        {
            var faker = new Faker<HistoryPosition>()
                .RuleFor(h => h.PostId, f => Guid.NewGuid())
                .RuleFor(h => h.Ticker, f => f.PickRandom(Tickers))
                .RuleFor(h => h.Side, f => f.PickRandom("BUY", "SELL"))
                .RuleFor(h => h.Quantity, f => f.Random.Int(1, 1000))
                .RuleFor(h => h.OpenPrice, f => f.Random.Decimal(1, 100))
                .RuleFor(h => h.ClosePrice, f => f.Random.Decimal(1, 100))
                .RuleFor(h => h.CloseTime, f => DateTime.Now.AddMinutes(-f.Random.Int(1, 100)))
                .RuleFor(h => h.OpenTime, (f, h) => h.CloseTime.AddMinutes(-60));

            return faker.Generate(new Random().Next(50, 200));
        }
    }
}
