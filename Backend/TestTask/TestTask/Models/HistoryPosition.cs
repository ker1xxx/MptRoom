using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TestTask.Models
{
    public class HistoryPosition
    {
        public Guid PostId { get; set; }
        public string Ticker { get; set; }
        public string Side { get; set; }
        public int Quantity { get; set; }
        public decimal OpenPrice { get; set; }
        public decimal ClosePrice { get; set; }
        public DateTime OpenTime { get; set; }
        public DateTime CloseTime { get; set; }
        public decimal PnL => Math.Round((ClosePrice - OpenPrice) * Quantity, 2);
    }
}
