four51.app.controller('ProductMatrixCtrl', ['$scope', '$routeParams', '$route', '$location', '$451', 'Product', 'ProductDisplayService', 'Order', 'Variant', 'User', 'ProductMatrix',
    function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User, ProductMatrix) {
        $scope.selected = 1;
        $scope.qtyError = null;
        $scope.LineItem = {};
        $scope.addToOrderText = "Add To Cart";
        $scope.loadingIndicator = true;
        $scope.loadingImage = true;
        $scope.searchTerm = null;
        $scope.currentOrder = $scope.$parent.$parent.currentOrder;
        $scope.settings = {
            currentPage: 1,
            pageSize: 10
        };

        function init(searchTerm) {
            ProductDisplayService.getProductAndVariant($routeParams.productInteropID, $routeParams.variantInteropID, function (data) {
                $scope.product= data.product;
                if ($scope.product.IsVBOSS) {
                    ProductMatrix.build($scope.product, $scope.currentOrder, function(matrix) {
                        $scope.comboVariants = matrix;
                    });
                }
            }, 1, 100, searchTerm);
        }
        $scope.$watch('settings.currentPage', function(n, o) {
            if (n != o || (n == 1 && o == 1))
                init($scope.searchTerm);
        });

        $scope.qtyChanged = function() {
            $scope.qtyError = "";
            var priceSchedule = $scope.product.StandardPriceSchedule;
            angular.forEach($scope.comboVariants, function(group) {
                angular.forEach(group, function(variant) {
                    var qty = variant.Quantity;
                    if (variant.Quantity) {
                        if(!$451.isPositiveInteger(qty))
                        {
                            $scope.qtyError += "<p>Please select a valid quantity for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";
                        }
                    }
                    if(priceSchedule.MinQuantity > qty && qty != 0){
                        $scope.qtyError += "<p>Quantity must be equal or greater than " + priceSchedule.MinQuantity + " for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";
                    }
                    if(priceSchedule.MaxQuantity && priceSchedule.MaxQuantity < qty){
                        $scope.qtyError += "<p>Quantity must be equal or less than " + priceSchedule.MaxQuantity + " for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";
                    }
                    var qtyAvail = variant.QuantityAvailable;
                    if(qtyAvail < qty && $scope.product.AllowExceedInventory == false){
                        $scope.qtyError = "<p>Quantity cannot exceed the Quantity Available of " +  qtyAvail + " for " + variant.DisplayName[0] + " " + variant.DisplayName[1] + "</p>";;
                    }
                });
            });
        }

        $scope.addVariantsToOrder = function(){
            if(!$scope.currentOrder){
                $scope.currentOrder = {};
                $scope.currentOrder.LineItems = [];
            }
            angular.forEach($scope.comboVariants, function(group) {
                angular.forEach(group, function(item) {
                    if (item.Quantity > 0) {
                        var liSpecs = {};
                        for (var spec in $scope.product.Specs) {
                            liSpecs[spec] = angular.copy($scope.product.Specs[spec]);
                            liSpecs[spec].Value = item.tempSpecs[spec].Value;
                        }
                        var li = {
                            "PriceSchedule":$scope.product.StandardPriceSchedule,
                            "Product":$scope.product,
                            "Quantity":item.Quantity,
                            "Specs":liSpecs,
                            "Variant":item,
                            "qtyError":null
                        }
                        $scope.currentOrder.LineItems.push(li);
                    }
                });
            });
            $scope.addToOrderIndicator = true;
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
        }
}]);


