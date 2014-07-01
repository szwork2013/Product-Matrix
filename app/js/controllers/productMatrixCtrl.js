four51.app.controller('ProductMatrixCtrl', ['$scope', '$routeParams', '$route', '$location', '$451', 'Product', 'ProductDisplayService', 'Order', 'Variant', 'User', 'ProductMatrix',
    function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User, ProductMatrix) {
        $scope.addToOrderText = "Add To Cart";
        $scope.searchTerm = null;
        $scope.currentOrder = $scope.$parent.$parent.currentOrder;

        function init(searchTerm) {
            ProductDisplayService.getProductAndVariant($routeParams.productInteropID, $routeParams.variantInteropID, function (data) {
                $scope.product = data.product;
                if ($scope.product.IsVBOSS) {
                    ProductMatrix.build($scope.product, $scope.currentOrder, function(matrix) {
                        $scope.comboVariants = matrix;
                    });
                }
            }, 1, 100, searchTerm);
        }
        init($scope.searchTerm);

        $scope.qtyChanged = function() {
            $scope.qtyError = "";
            ProductMatrix.validateQuantity($scope.comboVariants, $scope.product, function(message) {
                $scope.qtyError = message;
            });
        };

        $scope.addVariantsToOrder = function(){
            if(!$scope.currentOrder){
                $scope.currentOrder = {};
                $scope.currentOrder.LineItems = [];
            }
            ProductMatrix.addToOrder($scope.comboVariants, $scope.product, function(lineItems) {
                $scope.addToOrderIndicator = true;
                angular.forEach(lineItems, function(li) {
                    $scope.currentOrder.LineItems.push(li);
                });
                Order.save($scope.currentOrder,
                    function(o){
                        $scope.$parent.$parent.user.CurrentOrderID = o.ID;
                        User.save($scope.$parent.$parent.user, function(){
                            $scope.addToOrderIndicator = true;
                            $location.path('/cart');
                        });
                    },
                    function(ex) {
                        $scope.addToOrderIndicator = false;
                        $scope.addToOrderError = ex.Message;
                        $route.reload();
                    }
                );
            });
        };
}]);


