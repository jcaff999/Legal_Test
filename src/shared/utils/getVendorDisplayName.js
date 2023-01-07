module.exports = {
  /**
   * Returns the vendor display name
   * - name = "iManage" & tool = "iManage" => iManage
   * - name = "iManage" & tool = null => iManage
   * - name = null & tool = "iManage" => iManage
   * - name = "iManage" & tool = "Browser" => Browser by iManage
   */
  getVendorDisplayName(vendor, withBy = true) {
    const { tool, name } = vendor
    return tool && name && tool !== name ? (withBy ? `${tool} by ${name}` : `${tool} - ${name}`) : tool || name
  },

  getConsultancyDisplayName(consultancy, withBy = true) {
    const { serviceName, name } = consultancy
    return serviceName && name && serviceName !== name
      ? withBy
        ? `${serviceName} by ${name}`
        : `${serviceName} - ${name}`
      : serviceName || name
  },
}
