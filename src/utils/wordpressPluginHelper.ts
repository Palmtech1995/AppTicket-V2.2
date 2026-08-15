/**
 * ============================================================================
 * Xing Tai Enterprise Asset Management - WordPress Integration Package
 * ============================================================================
 * 
 * ไฟล์นี้สร้างโค้ดสำหรับนำแอปพลิเคชัน Xing Tai ไปติดตั้งบน WordPress
 * รองรับทั้งรูปแบบ:
 * 1. WordPress Plugin (Shortcode: [xingtai_asset_manager])
 * 2. WordPress Page Template (Full Screen Single Page App)
 * 3. Elementor / Gutenberg Custom HTML Widget
 * 4. WordPress WP-DB MySQL Direct Bridge
 */

export function generateWordPressPluginCode(appUrl: string = ''): string {
  return `<?php
/**
 * Plugin Name: Xing Tai Enterprise Asset & IT Ticket Management
 * Plugin URI: https://xingtai.co.th
 * Description: ระบบบริหารจัดการทะเบียนทรัพย์สิน ไอทีเฮลป์เดสก์ และใบโอนย้าย A4 สำหรับบริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด
 * Version: 1.0.0
 * Author: Xing Tai IT Engineering Team
 * Author URI: https://xingtai.co.th
 * Text Domain: xingtai-assets
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class XingTai_Asset_Manager_Plugin {
    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // 1. Register Shortcode [xingtai_assets] or [xingtai_asset_manager]
        add_shortcode('xingtai_assets', array($this, 'render_shortcode'));
        add_shortcode('xingtai_asset_manager', array($this, 'render_shortcode'));

        // 2. Add WordPress Admin Menu
        add_action('admin_menu', array($this, 'add_admin_menu'));

        // 3. Register Plugin Settings
        add_action('admin_init', array($this, 'register_settings'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'Xing Tai Asset System',
            'Xing Tai Assets',
            'manage_options',
            'xingtai-assets',
            array($this, 'render_admin_page'),
            'dashicons-clipboard',
            30
        );
    }

    public function register_settings() {
        register_setting('xingtai_asset_options', 'xingtai_app_url');
        register_setting('xingtai_asset_options', 'xingtai_embed_height');
    }

    public function render_admin_page() {
        $app_url = get_option('xingtai_app_url', '${appUrl || 'https://ais-dev-ohklwlk65pmw7nazlfzrzf-655001105109.asia-southeast1.run.app'}');
        $height = get_option('xingtai_embed_height', '100vh');
        ?>
        <div class="wrap" style="background:#fff; padding:20px; border-radius:12px; max-width:98%;">
            <h1 style="color:#0f172a; font-weight:700;">🏢 Xing Tai Enterprise Asset Management System</h1>
            <p style="color:#64748b;">ระบบทะเบียนทรัพย์สินและออกใบโอนย้าย A4 สำหรับบริษัท ซิงไท่ เทรดดิ้ง (ประเทศไทย) จำกัด</p>
            
            <form method="post" action="options.php" style="margin-bottom:24px; background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0;">
                <?php settings_fields('xingtai_asset_options'); ?>
                <?php do_settings_sections('xingtai_asset_options'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Application URL:</th>
                        <td>
                            <input type="text" name="xingtai_app_url" value="<?php echo esc_attr($app_url); ?>" style="width:100%; max-width:600px;" />
                            <p class="description">URL ของระบบ Xing Tai React/Node.js Server หรือ Cloud URL</p>
                        </td>
                    </tr>
                    <tr valign="top">
                        <th scope="row">ความสูงหน้าต่าง (Height):</th>
                        <td>
                            <input type="text" name="xingtai_embed_height" value="<?php echo esc_attr($height); ?>" style="width:120px;" />
                            <p class="description">เช่น 100vh หรือ 950px</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button('บันทึกการตั้งค่า WordPress'); ?>
            </form>

            <div style="background:#0f172a; padding:16px; border-radius:8px; color:#fff; margin-bottom:16px;">
                <strong>💡 วิธีนำไปแสดงบนหน้าเว็บ (Shortcode):</strong>
                <p>ใส่รหัส <code>[xingtai_assets]</code> หรือ <code>[xingtai_assets height="1000px"]</code> ในหน้าที่ต้องการสร้างเป็นระบบทรัพย์สิน</p>
            </div>

            <div style="border-radius:12px; overflow:hidden; border:1px solid #cbd5e1; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
                <iframe 
                    src="<?php echo esc_url($app_url); ?>" 
                    style="width:100%; height:800px; border:none;"
                    allow="camera; microphone; geolocation; clipboard-read; clipboard-write;"
                    title="Xing Tai Asset Manager"
                ></iframe>
            </div>
        </div>
        <?php
    }

    public function render_shortcode($atts) {
        $a = shortcode_atts(array(
            'url' => get_option('xingtai_app_url', '${appUrl || 'https://ais-dev-ohklwlk65pmw7nazlfzrzf-655001105109.asia-southeast1.run.app'}'),
            'height' => get_option('xingtai_embed_height', '100vh'),
            'width' => '100%',
        ), $atts);

        ob_start();
        ?>
        <div class="xingtai-asset-wrapper" style="width:<?php echo esc_attr($a['width']); ?>; height:<?php echo esc_attr($a['height']); ?>; position:relative; overflow:hidden; background:#090a0f;">
            <iframe 
                src="<?php echo esc_url($a['url']); ?>" 
                style="width:100%; height:100%; border:none; display:block;"
                allow="camera; microphone; geolocation; clipboard-read; clipboard-write;"
                loading="lazy"
                title="Xing Tai Enterprise Asset & IT Ticket Portal"
            ></iframe>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Initialize Plugin
XingTai_Asset_Manager_Plugin::get_instance();
`;
}
