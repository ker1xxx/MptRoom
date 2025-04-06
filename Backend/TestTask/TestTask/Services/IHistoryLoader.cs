using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TestTask.Models;

namespace TestTask.Services
{
    public interface IHistoryLoader
    {
        List<HistoryPosition> GenerateTradeHistroy();

    }
}
