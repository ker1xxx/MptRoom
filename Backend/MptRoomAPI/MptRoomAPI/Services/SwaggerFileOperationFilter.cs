using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace MptRoomAPI.Services
{
    public class SwaggerFileOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var formFileParameters = context.ApiDescription.ParameterDescriptions
                        .Where(p => p.Type == typeof(Microsoft.AspNetCore.Http.IFormFile))
                        .ToList();

            foreach (var parameter in formFileParameters)
            {
                // Добавляем описание для параметра
                var formFileParam = operation.Parameters.FirstOrDefault(p => p.Name == parameter.Name);

                if (formFileParam != null)
                {
                    // Указываем, что это файл, с типом string и форматом binary
                    formFileParam.Schema = new OpenApiSchema
                    {
                        Type = "string",
                        Format = "binary"
                    };
                }
            }
        }
    }
}
